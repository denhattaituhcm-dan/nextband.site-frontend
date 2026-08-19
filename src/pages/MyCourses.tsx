import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Play, UserCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MyCourses() {
  const { state, enrollments, isLoading, retry } = useStudentLifecycle();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Lớp Học & Khóa Học Của Tôi
        </h1>
        <p className="text-muted-foreground">
          Quản lý và tiếp tục học các lớp học và bài tập bạn đã tham gia
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : state === "API_ERROR" || state === "NETWORK_ERROR" ? (
        <Card className="p-8 text-center space-y-4 border-destructive/20 bg-destructive/5 rounded-2xl">
          <div className="text-destructive font-bold text-lg">Không thể tải danh sách lớp học</div>
          <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại.</p>
          <Button onClick={retry} variant="outline" size="sm" className="gap-2 mx-auto">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </Card>
      ) : enrollments && enrollments.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between border-border"
            >
              <div className="h-40 bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/15 p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-white/80 font-bold text-[10px] text-primary border-primary/20">
                    LỚP HỌC CHÍNH THỨC
                  </Badge>
                  <Badge variant="success" className="text-[10px]">
                    Đang hoạt động
                  </Badge>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {item.className}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Khóa {item.courseTitle}
                  </p>
                </div>
              </div>

              <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {item.teacherName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCheck className="h-4 w-4 text-primary shrink-0" />
                      <span>Giáo viên phụ trách: <strong className="text-foreground">{item.teacherName}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span>Luyện tập bài tập & thi trực tuyến</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-end">
                  <Button size="sm" asChild className="font-bold text-xs gap-1.5 rounded-xl">
                    <Link to={`/app/class/${item.classId}/lessons`}>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Vào Lớp Học
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/30">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Bạn chưa được phân vào lớp học nào
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Vui lòng liên hệ trung tâm hoặc giáo viên quản trị để được thêm vào lớp học của bạn.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">
              <BookOpen className="mr-2 h-4 w-4" />
              Quay lại Bàn làm việc
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
