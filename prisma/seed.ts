import { PrismaClient, AppRole, ResourceType, AttendanceStatus, InvitationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for Phase 0 Sprint 1...');

  const defaultAdminPassword = await bcrypt.hash('admin123', 10);
  const defaultTeacherPassword = await bcrypt.hash('teacher123', 10);
  const defaultStudentPassword = await bcrypt.hash('student123', 10);

  // 1. Create Teacher & Admin Users if not exist
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@ielts.com' },
    update: {
      password: defaultTeacherPassword,
    },
    create: {
      email: 'teacher@ielts.com',
      password: defaultTeacherPassword,
      fullName: 'Cô Hoàng Anh (IELTS 8.5)',
      roles: {
        create: { role: AppRole.teacher }
      }
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ielts.com' },
    update: {
      password: defaultAdminPassword,
    },
    create: {
      email: 'admin@ielts.com',
      password: defaultAdminPassword,
      fullName: 'Admin ARIS IELTS',
      roles: {
        create: { role: AppRole.admin }
      }
    }
  });

  // 2. Create Student User
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@ielts.com' },
    update: {
      password: defaultStudentPassword,
    },
    create: {
      email: 'student@ielts.com',
      password: defaultStudentPassword,
      fullName: 'Nguyễn Văn Học Viên',
      roles: {
        create: { role: AppRole.student }
      }
    }
  });

  // 3. Create Course: Dreamer
  const course = await prisma.course.upsert({
    where: { slug: 'dreamer-ielts' },
    update: {},
    create: {
      title: 'IELTS Dreamer (Target 5.5 - 6.5)',
      slug: 'dreamer-ielts',
      description: 'Lộ trình chuẩn bị nền tảng IELTS toàn diện 4 kỹ năng.',
      level: 'intermediate',
      isPublished: true,
      isActive: true,
      createdBy: teacherUser.id,
      lessons: {
        create: [
          {
            title: 'Buổi 1: Introduction to IELTS Reading & Skimming Techniques',
            description: 'Kỹ thuật đọc lướt và xác định Keyword trong bài đọc IELTS.',
            lessonOrder: 1,
            resources: {
              create: [
                { title: 'Slide Bài giảng Buổi 1', type: ResourceType.SLIDE, url: 'https://cdn.nextband.edu.vn/slides/lesson1.pdf' },
                { title: 'Danh mục Từ vựng Reading Task 1', type: ResourceType.PDF, url: 'https://cdn.nextband.edu.vn/docs/vocab-lesson1.pdf' }
              ]
            }
          },
          {
            title: 'Buổi 2: Listening Part 1 - Form Completion & Numbers',
            description: 'Chiến thuật làm bài nghe điền từ và ghi chép con số/chữ cái.',
            lessonOrder: 2,
            resources: {
              create: [
                { title: 'File Audio Luyện Nghe Buổi 2', type: ResourceType.AUDIO, url: 'https://cdn.nextband.edu.vn/audio/part1-practice.mp3' }
              ]
            }
          }
        ]
      }
    },
    include: { lessons: true }
  });

  // 4. Create Class: Dreamer K31
  const dreamerClass = await prisma.class.upsert({
    where: { id: 'dreamer-k31-id' },
    update: {},
    create: {
      id: 'dreamer-k31-id',
      name: 'Dreamer K31',
      description: 'Lớp IELTS Dreamer Khóa 31 (Tối 2 - 4 - 6)',
      courseId: course.id,
      teacherId: teacherUser.id,
      startDate: new Date(),
      isActive: true
    }
  });

  // 5. Enroll Student to Class
  await prisma.classStudent.upsert({
    where: {
      classId_studentId: {
        classId: dreamerClass.id,
        studentId: studentUser.id
      }
    },
    update: {},
    create: {
      classId: dreamerClass.id,
      studentId: studentUser.id
    }
  });

  // 6. Create Invitation for Dreamer K31
  await prisma.invitation.upsert({
    where: { inviteCode: 'DREAM31' },
    update: {},
    create: {
      classId: dreamerClass.id,
      inviteToken: 'inv_token_dreamer_k31_2026',
      inviteCode: 'DREAM31',
      createdBy: teacherUser.id,
      status: InvitationStatus.ACTIVE
    }
  });

  // 7. Create ClassSession & Attendance for Lesson 1
  const lesson1 = course.lessons.find(l => l.lessonOrder === 1);
  if (lesson1) {
    const session1 = await prisma.classSession.create({
      data: {
        classId: dreamerClass.id,
        lessonId: lesson1.id,
        sessionDate: new Date(),
        title: 'Buổi 1: Thảo luận Skimming & Scanning',
        notes: 'Cả lớp tương tác tốt, hoàn thành 80% bài đọc mẫu.'
      }
    });

    // Attendance
    await prisma.classAttendance.create({
      data: {
        sessionId: session1.id,
        studentId: studentUser.id,
        teacherId: teacherUser.id,
        status: AttendanceStatus.PRESENT,
        note: 'Đến đúng giờ'
      }
    });

    // 8. Create Homework for Lesson 1
    const homework = await prisma.homework.create({
      data: {
        classId: dreamerClass.id,
        classSessionId: session1.id,
        createdBy: teacherUser.id,
        title: 'Bài tập về nhà Buổi 1: Reading Cambridge 18 Test 1 Passage 1',
        description: 'Đọc đoạn văn và làm 13 câu hỏi trong file đính kèm.',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED'
      }
    });

    // 9. Create Student Submission
    await prisma.submission.create({
      data: {
        homeworkId: homework.id,
        studentId: studentUser.id,
        status: 'GRADED',
        submittedAt: new Date(),
        gradedAt: new Date(),
        score: 8.5,
        feedback: '## Nhận xét bài làm\n- **Ưu điểm**: Làm tốt các câu hỏi True/False/Not Given.\n- **Cần cải thiện**: Chú ý đếm số từ giới hạn (NO MORE THAN TWO WORDS).'
      }
    });
  }

  console.log('✅ Seed successfully completed for Phase 0 Sprint 1!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
