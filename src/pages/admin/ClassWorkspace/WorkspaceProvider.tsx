import React, { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { classesApi, sessionsApi, examsApi, submissionsApi, normalizeSession } from "@/lib/api";

interface WorkspaceContextType {
  classId: string;
  classData: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refetchClass: () => void;
  currentHomework: number;
  totalHomeworks: number;
  progressPercent: number;
  pendingReviewsCount: number;
  overdueCount: number;
  isAddStudentModalOpen: boolean;
  setIsAddStudentModalOpen: (open: boolean) => void;
  openAddStudentModal: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{
  classId: string;
  children: React.ReactNode;
}> = ({ classId, children }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  const {
    data: classData,
    isLoading,
    isError,
    error,
    refetch: refetchClass,
  } = useQuery({
    queryKey: ["admin-class-workspace", classId],
    queryFn: async () => {
      const [cls, rawSessions] = await Promise.all([
        classesApi.getById(classId),
        sessionsApi.list(classId),
      ]);

      // Single-point normalization of sessions
      const canonicalSessions = (rawSessions || []).map(normalizeSession);

      // Single canonical mapping for students from class_students / profiles
      const canonicalStudents = cls.students || cls.class_students || [];
      const activeStudents = canonicalStudents.filter(
        (s: any) => s.isActive !== false && s.status !== "suspended" && s.status !== "inactive"
      );

      // Fetch course homeworks/exams if course_id exists
      let lessons: any[] = [];
      const targetCourseId = cls.courseId || cls.course_id;
      if (targetCourseId) {
        try {
          const examRes = await examsApi.list({ courseId: targetCourseId, limit: 100 });
          lessons = examRes.data || [];
        } catch (examErr) {
          console.warn("[WorkspaceProvider] Could not fetch exams:", examErr);
        }
      }

      // Fetch submissions for this class
      let submissions: any[] = [];
      try {
        const subRes = await submissionsApi.list({ classId, limit: 200 });
        submissions = subRes.data || [];
      } catch (subErr) {
        console.warn("[WorkspaceProvider] Could not fetch submissions:", subErr);
      }

      return {
        ...cls,
        students: canonicalStudents,
        activeStudents,
        studentCount: activeStudents.length,
        sessions: canonicalSessions,
        lessons,
        submissions,
      };
    },
    enabled: !!classId,
  });

  const openAddStudentModal = () => setIsAddStudentModalOpen(true);

  const totalHomeworks = classData?.lessons?.length || 0;
  const activeStudentsList = classData?.activeStudents || [];
  const submissions = classData?.submissions || [];
  
  const pendingReviewsCount = submissions.filter(
    (s: any) => s.grade_status === "pending" || s.status === "submitted" || s.status === "SUBMITTED"
  ).length;

  const overdueCount = submissions.filter(
    (s: any) => s.status === "overdue" || s.status === "OVERDUE"
  ).length;

  const gradedSubmissionsCount = submissions.filter(
    (s: any) => s.grade_status === "graded" || s.status === "graded" || s.status === "GRADED"
  ).length;

  const currentHomework = totalHomeworks > 0 ? Math.min(gradedSubmissionsCount + 1, totalHomeworks) : 0;
  const totalAssigned = totalHomeworks * Math.max(1, activeStudentsList.length);
  const progressPercent = totalHomeworks > 0 && activeStudentsList.length > 0
    ? Math.round((gradedSubmissionsCount / totalAssigned) * 100)
    : 0;

  return (
    <WorkspaceContext.Provider
      value={{
        classId,
        classData,
        isLoading,
        isError,
        error: error as Error | null,
        activeTab,
        setActiveTab,
        refetchClass,
        currentHomework,
        totalHomeworks,
        progressPercent: Math.min(100, progressPercent),
        pendingReviewsCount,
        overdueCount,
        isAddStudentModalOpen,
        setIsAddStudentModalOpen,
        openAddStudentModal,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
