import { motion } from "framer-motion";
import { Pencil, Trash2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { DashboardEmployee } from "@/types";
import { cn } from "@/lib/utils";

export function EmployeeCard({
  name,
  role,
  assignedProject,
  employmentStatus,
  activeSwitchChecked,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  name: string;
  role: string;
  assignedProject: string;
  employmentStatus: DashboardEmployee["employmentStatus"];
  activeSwitchChecked: boolean;
  onToggleActive: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const badgeVariant =
    employmentStatus === "On Leave"
      ? "warning"
      : employmentStatus === "Active"
        ? "success"
        : employmentStatus === "Inactive"
          ? "destructive"
          : "secondary";
  const label =
    employmentStatus === "On Leave"
      ? "On Leave"
      : employmentStatus === "Inactive"
        ? "Inactive"
        : employmentStatus === "Offline"
          ? "Offline"
          : "Active";

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-white/60 bg-white/80 shadow-lg shadow-indigo-500/5 transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/70">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{name}</p>
              <p className="truncate text-xs text-slate-500">{role}</p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-500">Project: </span>
                {assignedProject}
              </p>
              <Badge variant={badgeVariant} className="mt-1">
                {label}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  activeSwitchChecked ? "text-emerald-600" : "text-slate-400"
                )}
              >
                Active
              </span>
              <Switch checked={activeSwitchChecked} onCheckedChange={onToggleActive} />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  !activeSwitchChecked ? "text-rose-500" : "text-slate-400"
                )}
              >
                Inactive
              </span>
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
                onClick={onDelete}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
