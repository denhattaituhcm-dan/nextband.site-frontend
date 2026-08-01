import React from "react";
import { useParams } from "react-router-dom";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceProvider";
import { FixedHeader } from "./components/FixedHeader";
import { QuickActions } from "./components/QuickActions";
import { WorkspaceSkeleton } from "./components/WorkspaceSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { StudentsTab } from "./tabs/StudentsTab";
import { GradingTab } from "./tabs/GradingTab";
import { HomeworkTab } from "./tabs/HomeworkTab";
import { AttendanceTab } from "./tabs/AttendanceTab";

const WorkspaceInner: React.FC = () => {
  const { activeTab, setActiveTab, isLoading } = useWorkspace();

  if (isLoading) {
    return <WorkspaceSkeleton type="overview" />;
  }

  return (
    <div className="space-y-4">
      {/* Sticky Fixed Header */}
      <FixedHeader />

      {/* 0-Click Quick Actions Bar */}
      <QuickActions />

      {/* Main 5 View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs font-semibold py-2">
            📊 Tổng quan
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs font-semibold py-2">
            👥 Học viên
          </TabsTrigger>
          <TabsTrigger value="grading" className="text-xs font-semibold py-2">
            ✍️ Chấm bài
          </TabsTrigger>
          <TabsTrigger value="homework" className="text-xs font-semibold py-2">
            📚 Homework
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs font-semibold py-2">
            📅 Điểm danh
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>
        <TabsContent value="grading">
          <GradingTab />
        </TabsContent>
        <TabsContent value="homework">
          <HomeworkTab />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function ClassWorkspaceRoot() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="p-8 text-center text-muted-foreground">Không tìm thấy mã lớp học.</div>;
  }

  return (
    <WorkspaceProvider classId={id}>
      <WorkspaceInner />
    </WorkspaceProvider>
  );
}
