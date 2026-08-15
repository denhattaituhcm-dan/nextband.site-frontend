import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertWidgetProps {
  role?: "admin" | "teacher" | "student";
}

export const AlertWidget: React.FC<AlertWidgetProps> = ({ role = "teacher" }) => {
  const queryClient = useQueryClient();
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts-widget", role],
    queryFn: () => alertsApi.list(role),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts-widget", role] }),
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center justify-between text-foreground">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Việc cần xử lý hôm nay ({alerts.length})
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
                <span className={alt.priority === "urgent" ? "text-destructive" : "text-warning"}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                {alt.context?.title || "Cần xử lý"}
              </div>
              {alt.age_days !== undefined && alt.age_days > 0 && (
                <div className="text-[10px] text-warning-foreground font-semibold flex items-center gap-1">
                  <Flame className="h-3 w-3 text-warning" />
                  Tồn tại {alt.age_days} ngày
                </div>
              )}
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

