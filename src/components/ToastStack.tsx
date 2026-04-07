import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";

export function ToastStack() {
  const { toasts, dismissToast } = useDashboard();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md",
              t.type === "success" && "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100",
              t.type === "error" && "border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-800 dark:bg-rose-950/90 dark:text-rose-100",
              t.type === "warn" && "border-amber-200 bg-amber-50/95 text-amber-950 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-100",
              t.type === "info" && "border-slate-200 bg-white/95 text-slate-800 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
            )}
          >
            <p className="flex-1 font-medium">{t.message}</p>
            <button
              type="button"
              className="rounded-md p-0.5 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
