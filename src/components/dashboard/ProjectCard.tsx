import { FolderKanban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "./ProgressBar";
import { projectStatusLabel } from "@/lib/dashboardDerived";

export function ProjectCard({
  name,
  description,
  assignedNames,
  deadlineLabel,
  status,
  progressPercent,
}: {
  name: string;
  description: string;
  assignedNames: string[];
  deadlineLabel: string;
  status: "Pending" | "In Progress" | "Completed";
  progressPercent: number;
}) {
  const label = projectStatusLabel(status);
  const badgeVariant =
    status === "Completed" ? "success" : status === "In Progress" ? "default" : "secondary";

  return (
    <Card className="overflow-hidden border-white/60 bg-white/80 shadow-lg shadow-indigo-500/5 transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/70">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
          <FolderKanban className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base leading-tight">{name}</CardTitle>
          <CardDescription className="mt-1 line-clamp-2">{description || "—"}</CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={badgeVariant}>{label}</Badge>
            {deadlineLabel !== "—" && (
              <Badge variant="outline" className="font-normal">
                Due {deadlineLabel}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Assigned employees</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {assignedNames.length ? assignedNames.join(", ") : "—"}
          </p>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Progress</span>
            <span className="tabular-nums text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} />
        </div>
      </CardContent>
    </Card>
  );
}
