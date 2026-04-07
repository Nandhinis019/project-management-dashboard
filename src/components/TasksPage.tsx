import * as React from "react";
import { motion } from "framer-motion";
import { Filter, Inbox, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { KanbanBoard } from "./KanbanBoard";
import { ConfirmDialog, Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";

export function TasksPage({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const {
    tasks,
    search,
    setSearch,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterDeadline,
    setFilterDeadline,
    addTask,
    updateTask,
    deleteTask,
  } = useDashboard();

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekEnd = startOfDay + 7 * 864e5;
    const q = search.trim().toLowerCase();

    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterDeadline === "overdue") {
        if (!t.deadline || t.status === "done") return false;
        if (new Date(t.deadline).getTime() >= startOfDay) return false;
      }
      if (filterDeadline === "week") {
        if (!t.deadline) return false;
        const d = new Date(t.deadline).getTime();
        if (d < startOfDay || d > weekEnd) return false;
      }
      return true;
    });
  }, [tasks, search, filterPriority, filterStatus, filterDeadline]);

  const empty = filtered.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tasks</h2>
          <p className="text-sm text-slate-500">Kanban · filters · inline edit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={() => onCreateOpenChange(true)}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

      <Card className="border-dashed border-slate-200/80 bg-white/60 dark:border-slate-700 dark:bg-slate-900/50">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-end">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Filters</span>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-[10px] uppercase text-slate-400">Priority</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-slate-400">Status</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <option value="all">All</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-slate-400">Deadline</Label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={filterDeadline}
                onChange={(e) => setFilterDeadline(e.target.value as typeof filterDeadline)}
              >
                <option value="all">Any</option>
                <option value="overdue">Overdue</option>
                <option value="week">This week</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-slate-400">Search</Label>
              <Input className="mt-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Instant filter…" />
            </div>
          </div>
        </CardContent>
      </Card>

      {empty ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-20 text-center dark:border-slate-700 dark:bg-slate-900/40"
        >
          <Inbox className="mb-4 h-16 w-16 text-slate-300" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">No tasks match</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Adjust filters or create a new task to get started.</p>
          <Button type="button" className="mt-6" onClick={() => onCreateOpenChange(true)}>
            Create task
          </Button>
        </motion.div>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onEdit={(t) => setEditTask(t)}
        />
      )}

      <TaskFormDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        title="Create task"
        onSave={(payload) => {
          addTask(payload);
          onCreateOpenChange(false);
        }}
      />

      {editTask && (
        <TaskFormDialog
          open={!!editTask}
          onOpenChange={(o) => !o && setEditTask(null)}
          title="Edit task"
          initial={editTask}
          onSave={(payload) => {
            updateTask(editTask.id, payload);
            setEditTask(null);
          }}
          onDelete={() => {
            setDeleteId(editTask.id);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete task?"
        description="This action cannot be undone."
        onConfirm={() => {
          if (deleteId) deleteTask(deleteId);
          setDeleteId(null);
          setEditTask(null);
        }}
      />
    </div>
  );
}

function TaskFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: Task;
  onSave: (payload: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: (initial?.priority ?? "medium") as TaskPriority,
    status: (initial?.status ?? "todo") as TaskStatus,
    progress: initial?.progress ?? 0,
    deadline: initial?.deadline ?? "",
    assignee: initial?.assignee ?? "",
  });

  React.useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        priority: initial.priority,
        status: initial.status,
        progress: initial.progress,
        deadline: initial.deadline ?? "",
        assignee: initial.assignee ?? "",
      });
    }
  }, [initial]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={initial ? "Update fields and save." : "Add a new task to your board."}
      footer={
        <>
          {onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              onSave({
                title: form.title.trim() || "Untitled",
                description: form.description,
                priority: form.priority,
                status: form.status,
                progress: Math.min(100, Math.max(0, Number(form.progress))),
                deadline: form.deadline || undefined,
                assignee: form.assignee || undefined,
              })
            }
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div>
          <Label htmlFor="t-title">Title</Label>
          <Input id="t-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="t-desc">Description</Label>
          <Textarea id="t-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Priority</Label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="t-prog">Progress %</Label>
            <Input
              id="t-prog"
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="t-due">Deadline</Label>
            <Input
              id="t-due"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="t-as">Assignee</Label>
          <Input id="t-as" value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Priority: {form.priority}</Badge>
          <Badge variant="outline">Status: {form.status.replace("_", " ")}</Badge>
        </div>
      </div>
    </Dialog>
  );
}
