import { basename, resolve, sep } from "path";
export class AuthorizationError extends Error {
    statusCode;
    constructor(message, statusCode = 403) {
        super(message);
        this.name = "AuthorizationError";
        this.statusCode = statusCode;
    }
}
export class NotFoundError extends Error {
    statusCode;
    constructor(message = "Tài nguyên không tồn tại") {
        super(message);
        this.name = "NotFoundError";
        this.statusCode = 404;
    }
}
export class AuthorizationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Xác thực quyền quản trị hoặc giáo viên phụ trách chính lớp học.
     * Throws 404 nếu lớp không tồn tại, 403 nếu không có quyền.
     */
    async requireClassTeacherOrAdmin(params) {
        const { userId, userRoles = [], classId } = params;
        const isAdmin = userRoles.includes("admin");
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
        });
        if (!cls) {
            throw new NotFoundError("Lớp học không tồn tại.");
        }
        if (isAdmin) {
            return cls;
        }
        const isTeacher = userRoles.includes("teacher");
        if (isTeacher && cls.teacherId === userId) {
            return cls;
        }
        throw new AuthorizationError("Từ chối truy cập: Bạn không có quyền thao tác trên lớp học này.", 403);
    }
    /**
     * Kiểm tra xem học viên có đang trong lớp học (active) hay không.
     */
    async isStudentEnrolledInClass(studentId, classId) {
        const record = await this.prisma.classStudent.findFirst({
            where: {
                classId,
                studentId,
            },
        });
        return !!record;
    }
    /**
     * Kiểm tra quyền làm/xem bài thi của học viên (hỗ trợ cả Direct Enrollment và Class Membership).
     */
    async isStudentAuthorizedForExam(params) {
        const { studentId, examId, courseId, isOpen } = params;
        if (isOpen)
            return true;
        // 1. Direct course enrollment
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId,
                    studentId,
                },
            },
        });
        if (enrollment)
            return true;
        // 2. Class-based membership (via ClassStudent)
        const classStudent = await this.prisma.classStudent.findFirst({
            where: {
                studentId,
                class: {
                    isActive: true,
                    OR: [
                        { courseId },
                        { homeworks: { some: { examId } } },
                    ],
                },
            },
        });
        return !!classStudent;
    }
    /**
     * Chuẩn hóa và kiểm tra ranh giới thư mục tuyệt đối chống Path Traversal.
     */
    validateUploadPathBoundary(params) {
        const { subDir, rawFileName, baseUploadDir } = params;
        if (subDir !== "images" && subDir !== "audio") {
            throw new AuthorizationError("Thư mục con không hợp lệ", 400);
        }
        // Lọc bỏ toàn bộ ký tự traversal bằng path.basename
        const safeFileName = basename(rawFileName.trim());
        if (!safeFileName || safeFileName === "." || safeFileName === "..") {
            throw new AuthorizationError("Tên tệp không hợp lệ", 400);
        }
        const targetBaseDir = resolve(baseUploadDir, subDir);
        const targetFilePath = resolve(targetBaseDir, safeFileName);
        // Strict Boundary Check: Phải nằm trong targetBaseDir + separator
        if (!targetFilePath.startsWith(targetBaseDir + sep)) {
            throw new AuthorizationError("Phát hiện hành vi điều hướng đường dẫn không hợp lệ (Path Traversal)", 403);
        }
        return targetFilePath;
    }
    /**
     * Authoring IDOR Protection: Xác thực quyền soạn thảo Đề thi (Admin hoặc Giáo viên phụ trách Khóa học).
     */
    async requireExamAuthoringAccess(examId, userId, userRoles = []) {
        if (userRoles.includes("admin"))
            return true;
        if (!userRoles.includes("teacher")) {
            throw new AuthorizationError("Chỉ giáo viên hoặc admin có quyền chỉnh sửa", 403);
        }
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { course: { select: { teacherId: true } } },
        });
        if (!exam) {
            throw new NotFoundError("Bài thi không tồn tại.");
        }
        if (exam.course?.teacherId && exam.course.teacherId !== userId) {
            throw new AuthorizationError("Từ chối quyền: Bạn không phụ trách khóa học chứa đề thi này.", 403);
        }
        return exam;
    }
    /**
     * Authoring IDOR Protection: Xác thực quyền soạn thảo Phần thi (Section).
     */
    async requireSectionAuthoringAccess(sectionId, userId, userRoles = []) {
        if (userRoles.includes("admin"))
            return true;
        if (!userRoles.includes("teacher")) {
            throw new AuthorizationError("Chỉ giáo viên hoặc admin có quyền chỉnh sửa", 403);
        }
        const section = await this.prisma.examSection.findUnique({
            where: { id: sectionId },
            include: { exam: { include: { course: { select: { teacherId: true } } } } },
        });
        if (!section) {
            throw new NotFoundError("Phần thi không tồn tại.");
        }
        const teacherId = section.exam?.course?.teacherId;
        if (teacherId && teacherId !== userId) {
            throw new AuthorizationError("Từ chối quyền: Bạn không phụ trách khóa học chứa phần thi này.", 403);
        }
        return section;
    }
    /**
     * Authoring IDOR Protection: Xác thực quyền soạn thảo Nhóm câu hỏi (QuestionGroup).
     */
    async requireQuestionGroupAuthoringAccess(groupId, userId, userRoles = []) {
        if (userRoles.includes("admin"))
            return true;
        if (!userRoles.includes("teacher")) {
            throw new AuthorizationError("Chỉ giáo viên hoặc admin có quyền chỉnh sửa", 403);
        }
        const group = await this.prisma.questionGroup.findUnique({
            where: { id: groupId },
            include: {
                section: {
                    include: { exam: { include: { course: { select: { teacherId: true } } } } },
                },
            },
        });
        if (!group) {
            throw new NotFoundError("Nhóm câu hỏi không tồn tại.");
        }
        const teacherId = group.section?.exam?.course?.teacherId;
        if (teacherId && teacherId !== userId) {
            throw new AuthorizationError("Từ chối quyền: Bạn không phụ trách khóa học chứa nhóm câu hỏi này.", 403);
        }
        return group;
    }
    /**
     * Authoring IDOR Protection: Xác thực quyền soạn thảo Câu hỏi (Question).
     */
    async requireQuestionAuthoringAccess(questionId, userId, userRoles = []) {
        if (userRoles.includes("admin"))
            return true;
        if (!userRoles.includes("teacher")) {
            throw new AuthorizationError("Chỉ giáo viên hoặc admin có quyền chỉnh sửa", 403);
        }
        const question = await this.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                group: {
                    include: {
                        section: {
                            include: { exam: { include: { course: { select: { teacherId: true } } } } },
                        },
                    },
                },
            },
        });
        if (!question) {
            throw new NotFoundError("Câu hỏi không tồn tại.");
        }
        const teacherId = question.group?.section?.exam?.course?.teacherId;
        if (teacherId && teacherId !== userId) {
            throw new AuthorizationError("Từ chối quyền: Bạn không phụ trách khóa học chứa câu hỏi này.", 403);
        }
        return question;
    }
}
