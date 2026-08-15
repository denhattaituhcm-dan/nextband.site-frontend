import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { usersApi, classesApi, invalidateClassQueries } from "@/lib/api";
import { Search, UserPlus, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useWorkspace } from "../../WorkspaceProvider";
import { toast } from "sonner";

interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const { classId, classData, refetchClass } = useWorkspace();
  const [activeTab, setActiveTab] = useState<"search" | "batch">("search");

  // Multi-select state for existing students
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Email batch text area state
  const [emailsText, setEmailsText] = useState("");

  // Existing student IDs already in this class (Canonical Student ID = Auth UID)
  const existingStudentIds = new Set(
    (classData?.students || []).map((s: any) => s.studentId).filter(Boolean)
  );

  // Query center students list
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["center-students", searchTerm],
    queryFn: () =>
      usersApi.list({
        role: "student",
        search: searchTerm,
        limit: 50,
      }),
    enabled: open && activeTab === "search",
  });

  const allCenterStudents = usersData?.data || [];

  // Toggle user selection
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible (not yet enrolled)
  const handleSelectAllVisible = () => {
    const enrollableIds = allCenterStudents
      .filter((u: any) => !existingStudentIds.has(u.id))
      .map((u: any) => u.id);
    
    if (selectedUserIds.length === enrollableIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(enrollableIds);
    }
  };

  // Add existing students mutation
  const addExistingMutation = useMutation({
    mutationFn: async () => {
      if (selectedUserIds.length === 0) return;
      return await classesApi.addStudents(classId, selectedUserIds);
    },
    onSuccess: () => {
      toast.success(`Đã thêm ${selectedUserIds.length} học viên vào lớp!`);
      setSelectedUserIds([]);
      invalidateClassQueries(queryClient, classId);
      refetchClass();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(`Lỗi khi thêm học viên: ${err.message || "Đã có lỗi xảy ra"}`);
    },
  });

  // Add by emails mutation
  const addByEmailsMutation = useMutation({
    mutationFn: async () => {
      const emailList = emailsText
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter(Boolean);

      if (emailList.length === 0) {
        throw new Error("Vui lòng nhập ít nhất một email");
      }

      return await classesApi.addStudentsByEmails(classId, emailList);
    },
    onSuccess: (res: any) => {
      toast.success(`Đã xử lý thêm ${res.added || 0} học viên theo Email!`);
      setEmailsText("");
      invalidateClassQueries(queryClient, classId);
      refetchClass();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Lỗi khi thêm học viên qua email");
    },
  });

  const isSubmitting = addExistingMutation.isPending || addByEmailsMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Thêm học viên vào lớp
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn học viên sẵn có từ danh sách trung tâm hoặc thêm nhanh qua Email.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="search" className="text-xs gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Chọn từ Trung tâm
            </TabsTrigger>
            <TabsTrigger value="batch" className="text-xs gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Thêm nhanh qua Email
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SEARCH & SELECT FROM CENTER */}
          <TabsContent value="search" className="space-y-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm học viên theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>Đã chọn ({selectedUserIds.length}) học viên</span>
              {allCenterStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-emerald-600 hover:underline font-medium"
                >
                  Chọn tất cả chưa có trong lớp
                </button>
              )}
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto divide-y bg-card">
              {isLoadingUsers ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  Đang tải danh sách học viên...
                </div>
              ) : allCenterStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Không tìm thấy học viên phù hợp
                </div>
              ) : (
                allCenterStudents.map((user: any) => {
                  const isAlreadyInClass = existingStudentIds.has(user.id);
                  const isChecked = selectedUserIds.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      onClick={() => !isAlreadyInClass && toggleSelectUser(user.id)}
                      className={`flex items-center justify-between p-3 transition-colors ${
                        isAlreadyInClass
                          ? "bg-muted/30 opacity-60 cursor-not-allowed"
                          : "hover:bg-muted/50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked || isAlreadyInClass}
                          disabled={isAlreadyInClass}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                            {user.fullName?.slice(0, 2).toUpperCase() || "HV"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs font-semibold">{user.fullName}</div>
                          <div className="text-[11px] text-muted-foreground">{user.email}</div>
                        </div>
                      </div>

                      <div>
                        {isAlreadyInClass ? (
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                            Đã trong lớp
                          </Badge>
                        ) : isChecked ? (
                          <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle className="mr-1 h-3 w-3" /> Đã chọn
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TAB 2: BATCH EMAIL INPUT */}
          <TabsContent value="batch" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Danh sách Email (mỗi email một dòng hoặc cách nhau bởi dấu phẩy):
              </label>
              <Textarea
                placeholder="nguyenvana@gmail.com&#10;tranvankhoa@gmail.com&#10;lethibinh@gmail.com"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                rows={5}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                * Các email chưa có tài khoản sẽ tự động được tạo profile chờ học viên đăng nhập kích hoạt.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 border-t pt-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>

          {activeTab === "search" ? (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={selectedUserIds.length === 0 || isSubmitting}
              onClick={() => addExistingMutation.mutate()}
            >
              {addExistingMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Thêm {selectedUserIds.length} học viên đã chọn
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={!emailsText.trim() || isSubmitting}
              onClick={() => addByEmailsMutation.mutate()}
            >
              {addByEmailsMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Thêm qua Email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
