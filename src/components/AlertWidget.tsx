import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi, AlertItem } from "@/lib/api";
import { AlertCircle, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center justify-between text-amber-900">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Việc cần xử lý hôm nay ({alerts.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className="p-3 bg-white rounded-xl border border-amber-100 flex items-center justify-between gap-3 text-xs shadow-sm"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className={alt.priority === "urgent" ? "text-rose-600" : "text-amber-600"}>
                  {alt.priority === "urgent" ? "🔴" : "🟡"}
                </span>
                {alt.context?.title || "Cần xử lý"}
              </div>
              {alt.age_days !== undefined && alt.age_days > 0 && (
                <div className="text-[10px] text-amber-700 font-semibold">
                  🔥 Tồn tại {alt.age_days} ngày
                </div>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0"
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
