import React from "react";
import { useParams } from "react-router-dom";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceProvider";
import { FixedHeader } from "./components/FixedHeader";
import { WorkspaceSkeleton } from "./components/WorkspaceSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { StudentsTab } from "./tabs/StudentsTab";
import { HomeworkTab } from "./tabs/HomeworkTab";
import { GradingTab } from "./tabs/GradingTab";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

const WorkspaceInner: React.FC = () => {
  const { activeTab, setActiveTab, isLoading, isError, error, refetchClass } = useWorkspace();

  if (isLoading) {
    return <WorkspaceSkeleton type="overview" />;
  }

  if (isError) {
    return (
      <div className="p-8 border rounded-xl bg-card text-center space-y-3 max-w-md mx-auto my-12 shadow-xs">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h4 className="text-base font-bold text-foreground">Không thể tải dữ liệu lớp học</h4>
        <p className="text-xs text-muted-foreground">
          {error?.message || "Đã xảy ra lỗi khi tải thông tin lớp học. Vui lòng kiểm tra lại kết nối."}
        </p>
        <Button size="sm" variant="outline" onClick={() => refetchClass()} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clean Identity Header */}
      <FixedHeader />

      {/* Main 4 Core View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs font-semibold py-2">
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="homework" className="text-xs font-semibold py-2">
            Nội dung & Bài tập
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs font-semibold py-2">
            Học viên & Điểm danh
          </TabsTrigger>
          <TabsTrigger value="grading" className="text-xs font-semibold py-2">
            Chấm bài
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="homework">
          <HomeworkTab />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>
        <TabsContent value="grading">
          <GradingTab />
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
