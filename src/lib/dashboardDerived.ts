import type { DashboardProject, Task } from "@/types";

export function projectStatusLabel(
  status: DashboardProject["status"]
): "Not Started" | "In Progress" | "Completed" {
  if (status === "Pending") return "Not Started";
  if (status === "In Progress") return "In Progress";
  return "Completed";
}

export function computeProjectProgressPercent(project: DashboardProject, tasks: Task[]): number {
  const team = new Set(
    project.assignedEmployees.map((e) => e.name.trim().toLowerCase()).filter(Boolean)
  );
  if (team.size === 0) {
    return Math.min(100, Math.max(0, Math.round(project.progress)));
  }
  const relevant = tasks.filter(
    (t) => t.assignee && team.has(String(t.assignee).trim().toLowerCase())
  );
  if (relevant.length === 0) {
    return Math.min(100, Math.max(0, Math.round(project.progress)));
  }
  const done = relevant.filter((t) => t.status === "done").length;
  return Math.round((done / relevant.length) * 100);
}

export function primaryProjectNameForEmployee(employeeId: string, projects: DashboardProject[]): string {
  const p = projects.find((pr) => pr.assignedEmployees.some((e) => e.id === employeeId));
  return p?.name ?? "—";
}

export function primaryProjectIdForEmployee(employeeId: string, projects: DashboardProject[]): string | null {
  const p = projects.find((pr) => pr.assignedEmployees.some((e) => e.id === employeeId));
  return p?.id ?? null;
}
