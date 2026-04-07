import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { GripVertical, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import type { Task, TaskStatus } from "@/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const priorityVariant: Record<Task["priority"], "default" | "secondary" | "warning" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  urgent: "destructive",
};

function DroppableColumn({
  id,
  title,
  count,
  children,
}: {
  id: TaskStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] flex-1 flex-col rounded-2xl border border-slate-200/80 bg-white/50 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-900/40",
        isOver && "ring-2 ring-indigo-400/60 ring-offset-2 dark:ring-offset-slate-950"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function DraggableTask({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.85 : 1, y: 0 }}
      className={cn("touch-none", isDragging && "z-50")}
    >
      <Card
        className={cn(
          "cursor-grab border-slate-200/90 bg-white/90 transition-shadow hover:shadow-lg active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800/90",
          isDragging && "shadow-2xl ring-2 ring-indigo-300"
        )}
      >
        <CardContent className="p-4 pt-4">
          <div className="flex items-start gap-2">
            <button
              type="button"
              className="mt-0.5 text-slate-400 hover:text-indigo-600"
              {...listeners}
              {...attributes}
              aria-label="Drag"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-white">{task.title}</p>
                <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
              </div>
              {task.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
              )}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  initial={false}
                  animate={{ width: `${task.progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">{task.progress}% complete</p>
              {task.deadline && (
                <p className="mt-1 text-[10px] text-slate-500">Due {task.deadline}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" type="button" onClick={() => onEdit(task)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KanbanBoard({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit: (t: Task) => void;
}) {
  const { moveTask, tasks: allTasks } = useDashboard();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const byStatus = useMemo(() => {
    const m: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) {
      m[t.status].push(t);
    }
    return m;
  }, [tasks]);

  const activeTask = useMemo(
    () => (activeId ? allTasks.find((t) => t.id === activeId) : null),
    [activeId, allTasks]
  );

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    let target = String(over.id);
    if (!["todo", "in_progress", "done"].includes(target)) {
      const overTask = allTasks.find((t) => t.id === target);
      if (overTask) target = overTask.status;
    }
    if (["todo", "in_progress", "done"].includes(target)) {
      moveTask(taskId, target as TaskStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <DroppableColumn key={col.id} id={col.id} title={col.label} count={byStatus[col.id].length}>
            {byStatus[col.id].map((task) => (
              <DraggableTask key={task.id} task={task} onEdit={onEdit} />
            ))}
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card className="w-[280px] border-indigo-200 bg-white shadow-2xl dark:border-indigo-800 dark:bg-slate-900">
            <CardContent className="p-4">
              <p className="font-semibold text-slate-900 dark:text-white">{activeTask.title}</p>
              <Badge className="mt-2" variant={priorityVariant[activeTask.priority]}>
                {activeTask.priority}
              </Badge>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
