import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, ListTodo, PlayCircle } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { EmployeeSection } from "./EmployeeSection";
import type { Task } from "@/types";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { computeProjectProgressPercent } from "@/lib/dashboardDerived";
import { ProjectCard } from "./ProjectCard";

function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

function priorityBadgeVariant(p: Task["priority"]): "secondary" | "default" | "warning" | "destructive" {
  if (p === "low") return "secondary";
  if (p === "medium") return "default";
  if (p === "high") return "warning";
  return "destructive";
}

function priorityLabel(p: Task["priority"]): string {
  const map: Record<Task["priority"], string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "High",
  };
  if (p === "urgent") return "High";
  return map[p];
}

function BizSummaryCard({
  icon,
  label,
  value,
  loading,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  loading: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="overflow-hidden border-white/60 bg-white/80 shadow-lg shadow-indigo-500/5 transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/70">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50">
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                <AnimatedCounter value={value} />
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function BusinessDashboardSections() {
  const { tasks, loading, backendOk, employeesRemote, projectsDetailRemote } = useDashboard();

  const projectStats = useMemo(() => {
    const total = projectsDetailRemote.length;
    const completed = projectsDetailRemote.filter((p) => p.status === "Completed").length;
    const ongoing = projectsDetailRemote.filter((p) => p.status === "In Progress").length;
    const pendingTasks = tasks.filter((t) => t.status !== "done").length;
    return { total, completed, ongoing, pendingTasks };
  }, [projectsDetailRemote, tasks]);

  const pendingTaskRows = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return tasks
      .filter((t) => t.status !== "done")
      .map((t) => {
        const overdue = !!(t.deadline && new Date(t.deadline).getTime() < startOfDay);
        return { t, overdue };
      });
  }, [tasks]);

  const showSkeleton =
    loading && !backendOk && employeesRemote.length === 0 && projectsDetailRemote.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BizSummaryCard
          icon={<Briefcase className="h-5 w-5 text-indigo-600" />}
          label="Total Projects"
          value={projectStats.total}
          loading={showSkeleton}
          delay={0}
        />
        <BizSummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Completed Projects"
          value={projectStats.completed}
          loading={showSkeleton}
          delay={0.05}
        />
        <BizSummaryCard
          icon={<PlayCircle className="h-5 w-5 text-violet-600" />}
          label="Ongoing Projects"
          value={projectStats.ongoing}
          loading={showSkeleton}
          delay={0.1}
        />
        <BizSummaryCard
          icon={<ListTodo className="h-5 w-5 text-amber-600" />}
          label="Pending Tasks"
          value={projectStats.pendingTasks}
          loading={showSkeleton}
          delay={0.15}
        />
      </div>

      <EmployeeSection showSkeleton={showSkeleton} />

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Briefcase className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Project Details</h2>
        </div>
        {showSkeleton ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : projectsDetailRemote.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/50">
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No projects returned from the API.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projectsDetailRemote.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                description={p.description}
                assignedNames={p.assignedEmployees.map((x) => x.name)}
                deadlineLabel={formatDeadline(p.deadline)}
                status={p.status}
                progressPercent={computeProjectProgressPercent(p, tasks)}
              />
            ))}
          </div>
        )}
      </div>

      <Card className="border-white/60 bg-white/80 shadow-lg shadow-indigo-500/5 dark:border-slate-700 dark:bg-slate-900/70">
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
          <CardDescription>Open work items with assignee, due date, and priority</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTaskRows.length === 0 ? (
            <p className="text-center text-sm text-slate-500">No pending tasks.</p>
          ) : (
            <div className="space-y-2">
              {pendingTaskRows.map(({ t, overdue }) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40",
                    overdue &&
                      "border-rose-300 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.assignee || "Unassigned"} · Due {formatDeadline(t.deadline)}
                    </p>
                  </div>
                  <Badge variant={priorityBadgeVariant(t.priority)}>{priorityLabel(t.priority)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
