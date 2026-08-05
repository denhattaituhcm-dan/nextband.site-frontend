import React, { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface WorkspaceContextType {
  classId: string;
  classData: any;
  isLoading: boolean;
  isError: boolean;
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
    refetch: refetchClass,
  } = useQuery({
    queryKey: ["admin-class-workspace", classId],
    queryFn: async () => {
      const cls = await classesApi.getById(classId);
      const students = cls.students || [];

      // Fetch course lessons (total homework count) if course_id exists
      let lessons: any[] = [];
      if (cls.course_id) {
        const { data: lessonData } = await supabase
          .from("course_lessons")
          .select("id, title, order_index")
          .eq("course_id", cls.course_id)
          .order("order_index", { ascending: true });
        lessons = lessonData || [];
      }

      // Fetch submissions for this class
      const { data: subs } = await supabase
        .from("submissions")
        .select("id, status, grade_status, created_at, student_id, homework_id")
        .eq("class_id", classId);

      const submissions = subs || [];

      return {
        ...cls,
        students,
        lessons,
        submissions,
      };
    },
    enabled: !!classId,
  });

  const openAddStudentModal = () => setIsAddStudentModalOpen(true);

  const totalHomeworks = classData?.lessons?.length || 0;
  const submissions = classData?.submissions || [];
  
  const pendingReviewsCount = submissions.filter(
    (s: any) => s.grade_status === "pending" || s.status === "submitted"
  ).length;

  const overdueCount = submissions.filter(
    (s: any) => s.status === "overdue"
  ).length;

  const gradedSubmissionsCount = submissions.filter(
    (s: any) => s.grade_status === "graded" || s.status === "graded"
  ).length;

  const currentHomework = totalHomeworks > 0 ? Math.min(gradedSubmissionsCount + 1, totalHomeworks) : 0;
  const progressPercent = totalHomeworks > 0 ? Math.round((gradedSubmissionsCount / (totalHomeworks * Math.max(1, classData?.students?.length || 1))) * 100) : 0;

  return (
    <WorkspaceContext.Provider
      value={{
        classId,
        classData,
        isLoading,
        isError,
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
