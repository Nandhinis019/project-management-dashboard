import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FolderKanban, AlertTriangle, CheckCircle2, ListTodo } from "lucide-react";
import { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { AnimatedCounter } from "./AnimatedCounter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { BusinessDashboardSections } from "./dashboard/BusinessDashboardSections";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"];

export function DashboardHome() {
  const { tasks, projectsRemote, loading } = useDashboard();

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const totalProjects = projectsRemote.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const pending = tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length;
    const overdue = tasks.filter((t) => {
      if (!t.deadline || t.status === "done") return false;
      return new Date(t.deadline).getTime() < startOfDay;
    }).length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { totalProjects, completed, pending, overdue, completionRate };
  }, [tasks, projectsRemote]);

  const weeklyProductivity = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = Date.now();
    return days.map((name, i) => {
      const dayStart = now - (6 - i) * 864e5;
      const dayEnd = dayStart + 864e5;
      const doneOnDay = tasks.filter((t) => {
        if (t.status !== "done") return false;
        return t.updatedAt >= dayStart && t.updatedAt < dayEnd;
      }).length;
      return { name, done: doneOnDay };
    });
  }, [tasks]);

  const teamPerformance = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== "done") continue;
      const k = t.assignee || "Unassigned";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const pieData = useMemo(
    () => [
      { name: "Done", value: tasks.filter((t) => t.status === "done").length },
      {
        name: "In progress",
        value: tasks.filter((t) => t.status === "in_progress").length,
      },
      { name: "To do", value: tasks.filter((t) => t.status === "todo").length },
    ],
    [tasks]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FolderKanban className="h-5 w-5 text-indigo-600" />}
          label="Total Projects"
          value={stats.totalProjects}
          loading={loading}
          delay={0}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Completed Tasks"
          value={stats.completed}
          loading={loading}
          delay={0.05}
        />
        <StatCard
          icon={<ListTodo className="h-5 w-5 text-violet-600" />}
          label="Pending Tasks"
          value={stats.pending}
          loading={loading}
          delay={0.1}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          label="Overdue Tasks"
          value={stats.overdue}
          loading={loading}
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task completion</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Overall completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] flex-col items-center justify-center">
              <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
                <AnimatedCounter value={stats.completionRate} />%
              </span>
              <p className="mt-2 text-sm text-slate-500">Tasks marked done</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly productivity</CardTitle>
            <CardDescription>Completed tasks (rolling week)</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProductivity}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="done" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team performance</CardTitle>
            <CardDescription>Completed tasks by assignee</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance.length ? teamPerformance : [{ name: "—", value: 0 }]}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <BusinessDashboardSections />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  delay,
}: {
  icon: React.ReactNode;
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
