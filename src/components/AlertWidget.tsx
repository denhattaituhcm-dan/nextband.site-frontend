import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, NotificationItem } from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertWidgetProps {
  role?: "admin" | "teacher" | "student";
}

export const AlertWidget: React.FC<AlertWidgetProps> = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["alerts-widget"],
    queryFn: () => notificationsApi.list({ limit: 10 }),
  });

  const alerts = (data?.data || []).filter(
    (n: NotificationItem) =>
      !n.isRead && (n.type === "PENDING_GRADING" || n.type === "NEW_SUBMISSION")
  );

  const resolveMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts-widget"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center justify-between text-foreground">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Việc cần xử lý ({alerts.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className="p-3 bg-card rounded-xl border border-border flex items-center justify-between gap-3 text-xs shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span className="text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                {alt.title}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{alt.message}</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 text-success border-success/30 hover:bg-success/10 shrink-0"
              onClick={() => resolveMutation.mutate(alt.id)}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Xong
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
