import axios from "axios";
import type { DashboardProject } from "@/types";

export const API_BASE = "http://localhost:5000/api";

/** Remove employee from every project, then optionally add to one project. */
export async function syncEmployeeProjectAssignment(
  employeeId: string,
  targetProjectId: string | null,
  projects: DashboardProject[]
): Promise<void> {
  const eid = employeeId;
  for (const p of projects) {
    const ids = p.assignedEmployees.map((x) => x.id);
    const has = ids.some((id) => id === eid);
    if (has && p.id !== targetProjectId) {
      await axios.put(`${API_BASE}/projects/${p.id}`, {
        assignedEmployees: ids.filter((id) => id !== eid),
      });
    }
  }
  if (targetProjectId) {
    const p = projects.find((x) => x.id === targetProjectId);
    if (!p) return;
    const ids = p.assignedEmployees.map((x) => x.id);
    if (!ids.includes(eid)) {
      await axios.put(`${API_BASE}/projects/${targetProjectId}`, {
        assignedEmployees: [...ids, eid],
      });
    }
  }
}

export async function removeEmployeeFromAllProjects(
  employeeId: string,
  projects: DashboardProject[]
): Promise<void> {
  const eid = employeeId;
  for (const p of projects) {
    const ids = p.assignedEmployees.map((x) => x.id);
    if (ids.some((id) => id === eid)) {
      await axios.put(`${API_BASE}/projects/${p.id}`, {
        assignedEmployees: ids.filter((id) => id !== eid),
      });
    }
  }
}
