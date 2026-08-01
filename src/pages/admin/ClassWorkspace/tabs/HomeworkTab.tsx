import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, LayoutGrid, ListFilter } from "lucide-react";

export const HomeworkTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState("all");

  const homeworkList = Array.from({ length: 27 }, (_, i) => {
    const hwNumber = i + 1;
    const submitted = hwNumber <= 12 ? (hwNumber === 12 ? 12 : 20) : 0;
    const missing = hwNumber <= 12 ? 20 - submitted : 20;
    const feedbackDone = hwNumber < 12 ? 20 : (hwNumber === 12 ? 5 : 0);

    return { hwNumber, submitted, missing, feedbackDone };
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          Góc nhìn bài tập (Homework 1 - 27)
        </h3>

        {/* View Mode Toggle & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="border rounded-lg p-0.5 flex bg-muted/40">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("table")}
            >
              <ListFilter className="h-3.5 w-3.5 mr-1" />
              Table
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {homeworkList.map((hw) => (
            <Card
              key={hw.hwNumber}
              className={`p-3 cursor-pointer hover:border-emerald-500 transition-all ${
                hw.hwNumber === 12 ? "border-2 border-emerald-500 bg-emerald-50/20" : ""
              }`}
            >
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">HW {hw.hwNumber}</span>
                  {hw.hwNumber === 12 && (
                    <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1">Đang mở</Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between"><span>Đã nộp:</span> <span className="font-semibold">{hw.submitted}/20</span></div>
                  <div className="flex justify-between"><span>Đã phản hồi:</span> <span className="font-semibold text-emerald-600">{hw.feedbackDone}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Homework</TableHead>
                <TableHead>Đã nộp</TableHead>
                <TableHead>Chưa nộp</TableHead>
                <TableHead>Đã phản hồi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homeworkList.map((hw) => (
                <TableRow key={hw.hwNumber}>
                  <TableCell className="font-medium">Homework {hw.hwNumber}</TableCell>
                  <TableCell>{hw.submitted} học viên</TableCell>
                  <TableCell className="text-rose-600">{hw.missing} học viên</TableCell>
                  <TableCell className="text-emerald-600 font-medium">{hw.feedbackDone} bài</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
