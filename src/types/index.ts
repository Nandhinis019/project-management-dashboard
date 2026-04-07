export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  deadline?: string;
  assignee?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  at: number;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warn";
}

export interface ProjectRow {
  id: string;
  name: string;
  progress: number;
  status: string;
}

/** Normalized employee row from GET /api/employees */
export interface DashboardEmployee {
  id: string;
  name: string;
  role: string;
  department?: string;
  employmentStatus: "Active" | "Inactive" | "On Leave" | "Offline";
  activity?: number;
}

/** Normalized project from GET /api/projects (populate) */
export interface DashboardProject {
  id: string;
  name: string;
  description: string;
  status: "Pending" | "In Progress" | "Completed";
  deadline: string | null;
  progress: number;
  assignedEmployees: { id: string; name: string; role: string }[];
}
