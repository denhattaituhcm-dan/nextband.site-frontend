import React, { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api";

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
    queryFn: () => classesApi.getById(classId),
    enabled: !!classId,
  });

  const openAddStudentModal = () => setIsAddStudentModalOpen(true);

  const currentHomework = 12;
  const totalHomeworks = 27;
  const progressPercent = Math.round((currentHomework / totalHomeworks) * 100);
  const pendingReviewsCount = 15;
  const overdueCount = 3;

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
        progressPercent,
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
