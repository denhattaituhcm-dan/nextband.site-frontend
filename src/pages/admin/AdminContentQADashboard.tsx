import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  RefreshCw, 
  BookOpen, 
  FileSpreadsheet, 
  ChevronRight, 
  Upload, 
  Edit3, 
  RotateCcw,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

interface ActionableRemedy {
  type: string;
  sectionId?: string;
  questionId?: string;
  message: string;
}

interface ExamAuditItem {
  examId: string;
  examTitle: string;
  courseTitle: string;
  week: number;
  score: number;
  qaStatus: "VERIFIED" | "IMPORTED" | "NEEDS_REVIEW" | "BROKEN";
  criticalErrors: string[];
  warnings: string[];
  actionableRemedies: ActionableRemedy[];
}

interface CourseHealthSummary {
  courseTitle: string;
  totalExams: number;
  verifiedCount: number;
  averageScore: number;
  healthBadge: "GREEN" | "YELLOW" | "RED";
}

export function AdminContentQADashboard() {
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [auditData, setAuditData] = useState<ExamAuditItem[]>([]);
  const [courseSummaries, setCourseSummaries] = useState<CourseHealthSummary[]>([]);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const { data: courses } = await supabase.from("courses").select("id, title").order("title");
      const { data: exams } = await supabase.from("exams").select("id, title, week, course_id, courses(title)").order("week");

      const items: ExamAuditItem[] = [];

      for (const e of (exams || [])) {
        const { data: sections } = await supabase
          .from("exam_sections")
          .select("id, title, section_type, audio_url")
          .eq("exam_id", e.id);

        let criticalErrors: string[] = [];
        let warnings: string[] = [];
        let remedies: ActionableRemedy[] = [];

        let score = 100;

        if (!sections || sections.length === 0) {
          criticalErrors.push("No sections configured");
          remedies.push({ type: "ADD_SECTIONS", message: "Create exam sections" });
          score = 0;
        } else {
          for (const s of sections) {
            const { data: groups } = await supabase
              .from("question_groups")
              .select("id, title, audio_url, passage")
              .eq("section_id", s.id);

            const groupList = groups || [];

            // Critical Invariant: Mismapped Section
            if (s.section_type === "general" && groupList.some(g => Boolean(g.audio_url || g.passage))) {
              criticalErrors.push(`Section '${s.title}' is mis-mapped (Content stuffed in Grammar)`);
              remedies.push({
                type: "REASSIGN_SECTION",
                sectionId: s.id,
                message: `Re-assign question groups from '${s.title}' to Listening/Reading`
              });
            }

            // Critical Invariant: Listening Missing Audio
            if (s.section_type === "listening" && groupList.length > 0 && !groupList.some(g => Boolean(g.audio_url || s.audio_url))) {
              criticalErrors.push(`Listening Section '${s.title}' missing Audio file`);
              score -= 35;
              remedies.push({
                type: "UPLOAD_AUDIO",
                sectionId: s.id,
                message: `Upload Audio URL for Listening section '${s.title}'`
              });
            }

            // Critical Invariant: Reading Missing Passage
            if (s.section_type === "reading" && groupList.length > 0 && !groupList.some(g => Boolean(g.passage))) {
              criticalErrors.push(`Reading Section '${s.title}' missing Passage text`);
              score -= 30;
              remedies.push({
                type: "EDIT_PASSAGE",
                sectionId: s.id,
                message: `Add reading passage text for '${s.title}'`
              });
            }
          }
        }

        score = Math.max(0, score);
        let qaStatus: "VERIFIED" | "IMPORTED" | "NEEDS_REVIEW" | "BROKEN" = "VERIFIED";

        if (criticalErrors.length > 0 || score < 50) {
          qaStatus = "BROKEN";
        } else if (score < 85) {
          qaStatus = "NEEDS_REVIEW";
        } else if (score < 100) {
          qaStatus = "IMPORTED";
        } else {
          qaStatus = "VERIFIED";
        }

        items.push({
          examId: e.id,
          examTitle: e.title,
          courseTitle: (e.courses as any)?.title || "Unknown",
          week: e.week,
          score,
          qaStatus,
          criticalErrors,
          warnings,
          actionableRemedies: remedies
        });
      }

      setAuditData(items);

      // Group by course for Course Health Summary
      const courseMap = new Map<string, ExamAuditItem[]>();
      items.forEach(it => {
        if (!courseMap.has(it.courseTitle)) courseMap.set(it.courseTitle, []);
        courseMap.get(it.courseTitle)!.push(it);
      });

      const summaries: CourseHealthSummary[] = [];
      courseMap.forEach((list, title) => {
        const total = list.length;
        const verified = list.filter(x => x.qaStatus === "VERIFIED").length;
        const avgScore = Math.round(list.reduce((acc, curr) => acc + curr.score, 0) / (total || 1));

        let badge: "GREEN" | "YELLOW" | "RED" = "GREEN";
        if (avgScore < 60 || verified / total < 0.4) badge = "RED";
        else if (avgScore < 85 || verified / total < 0.8) badge = "YELLOW";

        summaries.push({
          courseTitle: title,
          totalExams: total,
          verifiedCount: verified,
          averageScore: avgScore,
          healthBadge: badge
        });
      });

      setCourseSummaries(summaries);
    } catch (err) {
      console.error("Error fetching audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleReAudit = async () => {
    setAuditing(true);
    await fetchAuditData();
    setAuditing(false);
  };

  const filteredExams = auditData.filter(item => {
    const matchesCourse = selectedCourse === "ALL" || item.courseTitle === selectedCourse;
    const matchesStatus = statusFilter === "ALL" || item.qaStatus === statusFilter;
    return matchesCourse && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Content Infrastructure & QA Dashboard</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise Content Engineering Pipeline: 2-Tier Validation, Completeness Scoring & Actionable Remediation
          </p>
        </div>

        <Button 
          onClick={handleReAudit} 
          disabled={auditing} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${auditing ? "animate-spin" : ""}`} />
          {auditing ? "Scanning System..." : "Run System Re-Audit"}
        </Button>
      </div>

      {/* Course Health Hierarchy */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sky-400" />
          Course Health Hierarchy (Hierarchical Drill-down)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseSummaries.map((summary) => (
            <Card 
              key={summary.courseTitle} 
              onClick={() => setSelectedCourse(summary.courseTitle)}
              className={`cursor-pointer transition-all border-slate-800 bg-slate-900/60 hover:border-slate-700 ${
                selectedCourse === summary.courseTitle ? "ring-2 ring-emerald-500" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-white">{summary.courseTitle}</CardTitle>
                  <Badge 
                    className={
                      summary.healthBadge === "GREEN" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      summary.healthBadge === "YELLOW" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    }
                  >
                    {summary.healthBadge === "GREEN" ? "🟢 HEALTHY" : summary.healthBadge === "YELLOW" ? "🟡 WARNING" : "🔴 CRITICAL"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Completeness Score</span>
                    <span className="font-semibold text-white">{summary.averageScore}%</span>
                  </div>
                  <Progress value={summary.averageScore} className="h-1.5 bg-slate-800" />
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Verified Homeworks</span>
                    <span className="text-emerald-400 font-medium">{summary.verifiedCount} / {summary.totalExams}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/40 p-4 border border-slate-800 rounded-lg">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter Course:</span>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Courses ({auditData.length})</option>
            {courseSummaries.map(c => (
              <option key={c.courseTitle} value={c.courseTitle}>{c.courseTitle}</option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-4">Filter Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All QA Statuses</option>
            <option value="VERIFIED">✅ Verified (100%)</option>
            <option value="IMPORTED">🟡 Imported (85-99%)</option>
            <option value="NEEDS_REVIEW">⚠️ Needs Review (50-84%)</option>
            <option value="BROKEN">❌ Broken (&lt;50% or Critical Error)</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredExams.length}</span> of {auditData.length} Homeworks
        </div>
      </div>

      {/* Homework Completeness & Remediation Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Homework Title</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Completeness Score</th>
                <th className="px-6 py-4">QA Status</th>
                <th className="px-6 py-4">Issues / Critical Errors</th>
                <th className="px-6 py-4 text-right">Actionable Remedy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Scanning database for content completeness & invariant compliance...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No homeworks match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map((item) => (
                  <tr key={item.examId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {item.qaStatus === "VERIFIED" && <Lock className="h-3.5 w-3.5 text-emerald-400" />}
                        {item.examTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <Badge variant="outline" className="border-slate-700 text-slate-300">
                        {item.courseTitle}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white w-10">{item.score}%</span>
                        <Progress value={item.score} className="w-24 h-2 bg-slate-800" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.qaStatus === "VERIFIED" && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ✅ Verified
                        </Badge>
                      )}
                      {item.qaStatus === "IMPORTED" && (
                        <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 flex items-center gap-1.5 w-fit">
                          🟡 Imported
                        </Badge>
                      )}
                      {item.qaStatus === "NEEDS_REVIEW" && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1.5 w-fit">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          ⚠️ Needs Review
                        </Badge>
                      )}
                      {item.qaStatus === "BROKEN" && (
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 flex items-center gap-1.5 w-fit">
                          <XCircle className="h-3.5 w-3.5" />
                          ❌ Broken
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {item.criticalErrors.length > 0 ? (
                        <div className="space-y-1">
                          {item.criticalErrors.map((err, i) => (
                            <div key={i} className="text-rose-400 font-medium flex items-center gap-1">
                              • {err}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400">All invariants passed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.qaStatus === "VERIFIED" ? (
                        <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                          🔒 Content Frozen
                        </Badge>
                      ) : item.actionableRemedies.length > 0 ? (
                        <div className="flex justify-end gap-2">
                          {item.actionableRemedies.map((rem, i) => (
                            <Button 
                              key={i} 
                              size="sm" 
                              variant="outline" 
                              className="border-slate-700 hover:bg-slate-800 text-xs gap-1"
                              onClick={() => alert(`Actionable Remedy: ${rem.message}`)}
                            >
                              {rem.type === "UPLOAD_AUDIO" && <Upload className="h-3.5 w-3.5 text-sky-400" />}
                              {rem.type === "EDIT_QUESTION_TEXT" && <Edit3 className="h-3.5 w-3.5 text-amber-400" />}
                              {rem.type === "REASSIGN_SECTION" && <RotateCcw className="h-3.5 w-3.5 text-purple-400" />}
                              {rem.message.substring(0, 24)}...
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">No action required</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
