import { motion } from "framer-motion";
import axios from "axios";
import { Building2, Pencil, Trash2, UserMinus, UserPlus, Users, UserRoundPlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import type { DashboardEmployee } from "@/types";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { primaryProjectIdForEmployee, primaryProjectNameForEmployee } from "@/lib/dashboardDerived";
import {
  API_BASE,
  removeEmployeeFromAllProjects,
  syncEmployeeProjectAssignment,
} from "@/lib/employeeProjectSync";
import { EmployeeCard } from "./EmployeeCard";

function badgeForStatus(s: DashboardEmployee["employmentStatus"]) {
  if (s === "On Leave") return "warning" as const;
  if (s === "Active") return "success" as const;
  if (s === "Inactive") return "destructive" as const;
  return "secondary" as const;
}

function statusText(s: DashboardEmployee["employmentStatus"]) {
  if (s === "On Leave") return "On Leave";
  if (s === "Inactive") return "Inactive";
  if (s === "Offline") return "Offline";
  return "Active";
}

export function EmployeeSection({ showSkeleton }: { showSkeleton: boolean }) {
  const { employeesRemote, projectsDetailRemote, refreshRemote, pushToast } = useDashboard();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingEmployee, setEditingEmployee] = useState<DashboardEmployee | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const employeeStats = useMemo(() => {
    const total = employeesRemote.length;
    const active = employeesRemote.filter((e) => e.employmentStatus === "Active").length;
    const onLeave = employeesRemote.filter((e) => e.employmentStatus === "On Leave").length;
    return { total, active, onLeave };
  }, [employeesRemote]);

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditingEmployee(null);
    setName("");
    setRole("");
    setProjectId("");
    setFormOpen(true);
  }, []);

  const openEdit = useCallback(
    (e: DashboardEmployee) => {
      setFormMode("edit");
      setEditingEmployee(e);
      setName(e.name);
      setRole(e.role);
      setProjectId(primaryProjectIdForEmployee(e.id, projectsDetailRemote) ?? "");
      setFormOpen(true);
    },
    [projectsDetailRemote]
  );

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingEmployee(null);
  }, []);

  const handleSubmitForm = useCallback(async () => {
    if (!name.trim()) {
      pushToast("Name is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const target = projectId || null;
      if (formMode === "add") {
        const { data } = await axios.post(`${API_BASE}/employees`, {
          name: name.trim(),
          role: role.trim() || "Employee",
          employmentStatus: "Active",
        });
        const newId = String((data as { _id?: string })._id ?? "");
        await syncEmployeeProjectAssignment(newId, target, projectsDetailRemote);
        pushToast("Employee added", "success");
      } else if (editingEmployee) {
        await axios.put(`${API_BASE}/employees/${editingEmployee.id}`, {
          name: name.trim(),
          role: role.trim() || "Employee",
          employmentStatus: editingEmployee.employmentStatus,
        });
        await syncEmployeeProjectAssignment(editingEmployee.id, target, projectsDetailRemote);
        pushToast("Employee updated", "success");
      }
      closeForm();
      await refreshRemote({ silent: true });
    } catch (err) {
      pushToast(
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Request failed",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    closeForm,
    editingEmployee,
    formMode,
    name,
    projectId,
    projectsDetailRemote,
    pushToast,
    refreshRemote,
    role,
  ]);

  const handleToggleActive = useCallback(
    async (e: DashboardEmployee, nextActive: boolean) => {
      const nextStatus = nextActive ? "Active" : "Inactive";
      try {
        await axios.put(`${API_BASE}/employees/${e.id}`, {
          employmentStatus: nextStatus,
        });
        await refreshRemote({ silent: true });
        pushToast(`Status: ${nextStatus}`, "success");
      } catch {
        pushToast("Could not update status", "error");
      }
    },
    [pushToast, refreshRemote]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await removeEmployeeFromAllProjects(deleteId, projectsDetailRemote);
      await axios.delete(`${API_BASE}/employees/${deleteId}`);
      pushToast("Employee removed", "info");
      setDeleteId(null);
      await refreshRemote({ silent: true });
    } catch {
      pushToast("Could not delete employee", "error");
    } finally {
      setSubmitting(false);
    }
  }, [deleteId, projectsDetailRemote, pushToast, refreshRemote]);

  return (
    <>
      <Card className="border-white/60 bg-white/80 shadow-lg shadow-indigo-500/5 dark:border-slate-700 dark:bg-slate-900/70">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <CardTitle>Employee Overview</CardTitle>
            </div>
            <Button
              type="button"
              className="gap-2 shrink-0"
              onClick={openAdd}
              disabled={submitting || showSkeleton}
            >
              <UserRoundPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
          <CardDescription>Team size, availability, and assignments from the API</CardDescription>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Users className="h-3.5 w-3.5" />
                Total Employees
              </div>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {showSkeleton ? <Skeleton className="h-8 w-12" /> : <AnimatedCounter value={employeeStats.total} />}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                Active Employees
              </div>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {showSkeleton ? <Skeleton className="h-8 w-12" /> : <AnimatedCounter value={employeeStats.active} />}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <UserMinus className="h-3.5 w-3.5 text-amber-600" />
                On Leave
              </div>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {showSkeleton ? <Skeleton className="h-8 w-12" /> : <AnimatedCounter value={employeeStats.onLeave} />}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : employeesRemote.length === 0 ? (
            <p className="text-center text-sm text-slate-500">No employees returned from the API.</p>
          ) : (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700">
                    <th className="py-3 pr-3">Name</th>
                    <th className="py-3 pr-3">Role</th>
                    <th className="py-3 pr-3">Assigned Project</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Active</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employeesRemote.map((e) => (
                    <motion.tr
                      key={e.id}
                      layout
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-3 pr-3 font-medium text-slate-900 dark:text-white">{e.name}</td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{e.role}</td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                        {primaryProjectNameForEmployee(e.id, projectsDetailRemote)}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={badgeForStatus(e.employmentStatus)}>{statusText(e.employmentStatus)}</Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-semibold uppercase",
                              e.employmentStatus === "Active" ? "text-emerald-600" : "text-slate-400"
                            )}
                          >
                            {e.employmentStatus === "Active" ? "On" : "Off"}
                          </span>
                          <Switch
                            checked={e.employmentStatus === "Active"}
                            onCheckedChange={(v) => void handleToggleActive(e, v)}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(e)}
                            aria-label="Edit employee"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => setDeleteId(e.id)}
                            aria-label="Delete employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!showSkeleton && employeesRemote.length > 0 && (
            <div className="mt-4 grid gap-3 md:hidden">
              {employeesRemote.map((e) => (
                <EmployeeCard
                  key={e.id}
                  name={e.name}
                  role={e.role}
                  assignedProject={primaryProjectNameForEmployee(e.id, projectsDetailRemote)}
                  employmentStatus={e.employmentStatus}
                  activeSwitchChecked={e.employmentStatus === "Active"}
                  onToggleActive={(v) => void handleToggleActive(e, v)}
                  onEdit={() => openEdit(e)}
                  onDelete={() => setDeleteId(e.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(o) => !o && closeForm()}
        title={formMode === "add" ? "Add Employee" : "Edit Employee"}
        description="Set name, role, and optional project assignment."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmitForm()} disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <Label htmlFor="emp-name">Name</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="emp-role">Role</Label>
            <Input
              id="emp-role"
              value={role}
              onChange={(ev) => setRole(ev.target.value)}
              placeholder="e.g. Developer"
            />
          </div>
          <div>
            <Label htmlFor="emp-project">Assign Project</Label>
            <select
              id="emp-project"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={projectId}
              onChange={(ev) => setProjectId(ev.target.value)}
            >
              <option value="">— None —</option>
              {projectsDetailRemote.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete employee?"
        description="This removes the employee and unassigns them from all projects."
        loading={submitting}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
