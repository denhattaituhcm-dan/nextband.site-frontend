import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, useNavigate } from "react-router-dom";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import { NotificationBell } from "./NotificationBell";
import { useAuth as useAuthInner } from "@/hooks/useAuth";

export function ClientHeader() {
  const { user, signOut, isAdmin, isAuthenticated, isTeacher } = useAuth();
  const navigate = useNavigate();
  const { classId: urlClassId } = useParams<{ classId?: string }>();

  const { state, resolveClass } = useStudentLifecycle();

  const resolved = resolveClass(urlClassId);
  const activeClassName =
    state === "ENROLLED" && resolved.status === "AUTHORIZED"
      ? resolved.activeClass.className
      : null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-3">
            {/* ENROLLED → show active class name */}
            {state === "ENROLLED" && activeClassName && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
                {activeClassName}
              </span>
            )}

            {/* PRE_ENROLLMENT (Backend-confirmed) → show "Chưa có lớp học" */}
            {state === "PRE_ENROLLMENT" && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning-foreground border border-warning/20">
                Chưa có lớp học
              </span>
            )}

            {/* LOADING / API_ERROR / NETWORK_ERROR → render nothing
                Do NOT show "Chưa có lớp học" — that is a false statement. */}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell scope={isTeacher ? "teacher" : "student"} />
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
            >
              Quản trị
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.fullName || "Người dùng"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
