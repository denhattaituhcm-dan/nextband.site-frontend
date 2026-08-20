/**
 * Lấy danh sách studentId thuộc các lớp mà teacher phụ trách.
 * Dùng để filter dữ liệu cho teacher chỉ thấy học sinh lớp mình.
 */
export async function getTeacherStudentIds(prisma, teacherId) {
    const classStudents = await prisma.classStudent.findMany({
        where: {
            class: {
                teacherId,
            },
        },
        select: {
            studentId: true,
        },
    });
    return [...new Set(classStudents.map((cs) => cs.studentId))];
}
/**
 * Lấy danh sách studentId thuộc 1 lớp cụ thể.
 */
export async function getClassStudentIds(prisma, classId) {
    const classStudents = await prisma.classStudent.findMany({
        where: { classId },
        select: { studentId: true },
    });
    return [...new Set(classStudents.map((cs) => cs.studentId))];
}
/**
 * Kiểm tra xem teacher có phụ trách lớp có chứa student này không.
 */
export async function isStudentInTeacherClasses(prisma, teacherId, studentId) {
    const count = await prisma.classStudent.count({
        where: {
            studentId,
            class: {
                teacherId,
            },
        },
    });
    return count > 0;
}
/**
 * Kiểm tra teacher có phải chủ lớp không.
 */
export async function isTeacherOfClass(prisma, teacherId, classId) {
    const cls = await prisma.class.findFirst({
        where: {
            id: classId,
            teacherId,
        },
    });
    return !!cls;
}
