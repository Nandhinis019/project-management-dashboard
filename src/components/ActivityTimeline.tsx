import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ActivityTimeline() {
  const { activities } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Activity</h2>
        <p className="text-sm text-slate-500">Recent actions across your workspace</p>
      </div>

      <Card className="border-slate-200/80 bg-white/70 shadow-lg dark:border-slate-700 dark:bg-slate-900/60">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-100 dark:border-slate-800">
          <Activity className="h-5 w-5 text-violet-600" />
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No activity yet — create tasks or log in to see history.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {activities.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className="flex gap-4 px-4 py-4"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{a.label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{a.detail}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{new Date(a.at).toLocaleString()}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
