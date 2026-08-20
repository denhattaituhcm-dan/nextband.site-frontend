import { ClassRepository } from '../repositories/class.repository.js';
import { AuthorizationService, AuthorizationError, NotFoundError } from './authorization.service.js';
export class LessonService {
    prisma;
    classRepo;
    authService;
    constructor(prisma) {
        this.prisma = prisma;
        this.classRepo = new ClassRepository(prisma);
        this.authService = new AuthorizationService(prisma);
    }
    // Projection: GET /classes/:classId/lessons
    async getClassLessonProjection(classId, userId, userRoles) {
        const isTeacherOrAdmin = userRoles.includes('admin') || userRoles.includes('teacher');
        // 1. Authorization Check: Must be enrolled student or managing teacher/admin
        const classData = await this.classRepo.findById(classId);
        if (!classData) {
            throw new NotFoundError('Lớp học không tồn tại.');
        }
        if (!isTeacherOrAdmin) {
            const isEnrolled = await this.authService.isStudentEnrolledInClass(userId, classId);
            if (!isEnrolled) {
                throw new AuthorizationError('Bạn không có quyền truy cập lộ trình lớp học này.', 403);
            }
        }
        else if (userRoles.includes('teacher') && !userRoles.includes('admin')) {
            if (classData.teacherId !== userId) {
                throw new AuthorizationError('Bạn không có quyền quản lý lớp học này.', 403);
            }
        }
        // 2. Fetch Course Exams & Student Submissions (Canonical Chain: Class -> Course -> Exam -> Submission)
        const courseId = classData.courseId;
        let exams = [];
        let submissions = [];
        if (courseId) {
            exams = await this.prisma.exam.findMany({
                where: { courseId, isPublished: true },
                orderBy: { week: 'asc' },
                include: { sections: true },
            });
            const examIds = exams.map((e) => e.id);
            if (examIds.length > 0) {
                submissions = await this.prisma.examSubmission.findMany({
                    where: {
                        studentId: userId,
                        examId: { in: examIds },
                    },
                    orderBy: { createdAt: 'desc' },
                });
            }
        }
        let completedCount = 0;
        const lessonsProjection = exams.map((exam, idx) => {
            const sub = submissions.find((s) => s.examId === exam.id);
            const isGraded = sub?.status === 'GRADED' || sub?.status === 'graded';
            const isSubmitted = sub?.status === 'SUBMITTED' || sub?.status === 'submitted' || isGraded;
            if (isGraded)
                completedCount++;
            return {
                id: exam.id,
                title: exam.title,
                description: exam.description || null,
                lessonOrder: exam.week || (idx + 1),
                estimatedMinutes: exam.durationMinutes || 60,
                status: exam.isPublished ? 'PUBLISHED' : 'DRAFT',
                sessionDate: null,
                sessionNumber: exam.week || (idx + 1),
                resources: [],
                homework: {
                    id: exam.id,
                    title: exam.title,
                    deadline: null,
                    status: sub ? String(sub.status).toUpperCase() : 'NOT_STARTED',
                    score: sub?.totalScore != null ? Number(sub.totalScore) : null,
                },
                submission: sub || null,
                progress: {
                    sessionCompleted: true,
                    homeworkSubmitted: isSubmitted,
                    homeworkGraded: isGraded,
                    lessonCompleted: isGraded,
                },
            };
        });
        const totalLessons = exams.length;
        const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        return {
            classId: classData.id,
            className: classData.name,
            courseTitle: classData.course?.title || classData.name,
            progress: {
                completedLessons: completedCount,
                totalLessons,
                percentage,
            },
            lessons: lessonsProjection,
        };
    }
    // Projection: GET /classes/:classId/progress
    async getClassProgressProjection(classId, userId, userRoles) {
        const projection = await this.getClassLessonProjection(classId, userId, userRoles);
        return {
            classId: projection.classId,
            className: projection.className,
            courseTitle: projection.courseTitle,
            progress: projection.progress,
        };
    }
}
