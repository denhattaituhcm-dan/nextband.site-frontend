import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  GraduationCap,
  ChevronLeft,
  ClipboardCheck,
  School,
  ShieldCheck,
  FolderKanban,
  Award,
  Mic,
  UserPlus,
  Bell,
  FileCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SiteLogo } from "@/components/common/SiteLogo";

// 🎓 NHÓM 1: GIẢNG DẠY (Công việc hàng ngày của Giáo viên & Admin)
const teachingItems = [
  {
    title: "Lớp học",
    url: "/admin/classes",
    icon: School,
  },
  {
    title: "Chấm bài lớp",
    url: "/admin/teacher-workspace",
    icon: ClipboardCheck,
  },
  {
    title: "Khảo thí thử",
    url: "/admin/assessments",
    icon: FileCheck,
  },
  {
    title: "Ngân hàng bài",
    url: "/admin/exams",
    icon: FolderKanban,
  },
];

// ⚙️ NHÓM 2: QUẢN TRỊ HỆ THỐNG (Chỉ Admin mới có)
const adminItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Khách tư vấn (Leads)",
    url: "/admin/leads",
    icon: UserPlus,
  },
  {
    title: "Khóa học",
    url: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Speaking Forecast",
    url: "/admin/speaking-forecast",
    icon: Mic,
  },
  {
    title: "Evidence",
    url: "/admin/evidence",
    icon: Award,
  },
  {
    title: "Học viên",
    url: "/admin/users?role=student",
    icon: Users,
  },
  {
    title: "Giáo viên",
    url: "/admin/teachers",
    icon: GraduationCap,
  },
  {
    title: "Quản trị viên",
    url: "/admin/admins",
    icon: ShieldCheck,
  },
  {
    title: "Thông báo",
    url: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Cài đặt",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { isAdmin } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar font-sans">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-full items-center justify-start overflow-hidden">
            <SiteLogo
              alt="NextBand Admin Logo"
              className={`transition-all ${collapsed ? "w-8" : "max-h-8 w-auto"}`}
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* 🎓 SECTION 1: GIẢNG DẠY (Giáo viên & Admin) */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pt-2">
            🎓 GIẢNG DẠY
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teachingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ⚙️ SECTION 2: QUẢN TRỊ HỆ THỐNG (ADMIN ONLY) */}
        {isAdmin && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-t border-slate-100 pt-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              ⚙️ QUẢN TRỊ HỆ THỐNG
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button variant="outline" className="w-full justify-start text-xs font-semibold text-muted-foreground" asChild>
          <Link to="/app">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {!collapsed && "Về Student Portal"}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

