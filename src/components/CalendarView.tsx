import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import type { Task } from "@/types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function weekdayLabels() {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}

export function CalendarView() {
  const { tasks } = useDashboard();
  const [cursor, setCursor] = useState(() => new Date());

  const monthStart = startOfMonth(cursor);
  const pad = monthStart.getDay();
  const totalDays = daysInMonth(cursor);
  const monthName = cursor.toLocaleString("default", { month: "long", year: "numeric" });

  const tasksByDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.deadline) continue;
      const key = t.deadline.slice(0, 10);
      const arr = m.get(key) ?? [];
      arr.push(t);
      m.set(key, arr);
    }
    return m;
  }, [tasks]);

  const cells = useMemo(() => {
    const out: { day: number | null; key: string }[] = [];
    for (let i = 0; i < pad; i++) out.push({ day: null, key: `p-${i}` });
    for (let d = 1; d <= totalDays; d++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ day: d, key });
    }
    while (out.length % 7 !== 0) out.push({ day: null, key: `t-${out.length}` });
    return out;
  }, [pad, totalDays, cursor]);

  const shiftMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Calendar</h2>
        <p className="text-sm text-slate-500">Deadlines at a glance</p>
      </div>

      <Card className="overflow-hidden border-slate-200/80 bg-white/70 shadow-lg dark:border-slate-700 dark:bg-slate-900/60">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">{monthName}</CardTitle>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => shiftMonth(-1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => setCursor(new Date())}
            >
              Today
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => shiftMonth(1)}
            >
              Next
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {weekdayLabels().map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const dayTasks = cell.day ? tasksByDay.get(cell.key) ?? [] : [];
              const today = new Date();
              const isToday =
                cell.day !== null &&
                today.getFullYear() === cursor.getFullYear() &&
                today.getMonth() === cursor.getMonth() &&
                today.getDate() === cell.day;

              return (
                <motion.div
                  key={cell.key}
                  layout
                  className={cn(
                    "min-h-[88px] rounded-xl border border-transparent p-1.5 text-left transition-colors",
                    cell.day === null && "bg-transparent",
                    cell.day !== null && "border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40",
                    isToday && "ring-2 ring-indigo-400/70"
                  )}
                >
                  {cell.day !== null && (
                    <>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cell.day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className="truncate rounded-md bg-white/90 px-1 py-0.5 text-[9px] font-medium text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200"
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <p className="text-[9px] text-slate-400">+{dayTasks.length - 3} more</p>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/60 dark:border-slate-700 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Upcoming deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks
            .filter((t) => t.deadline && t.status !== "done")
            .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
            .slice(0, 12)
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.deadline}</p>
                </div>
                <Badge variant="outline">{t.priority}</Badge>
              </div>
            ))}
          {tasks.filter((t) => t.deadline && t.status !== "done").length === 0 && (
            <p className="text-center text-sm text-slate-500">No upcoming deadlines.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
