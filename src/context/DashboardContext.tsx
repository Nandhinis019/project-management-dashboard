import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import type {
  ActivityItem,
  DashboardEmployee,
  DashboardProject,
  Task,
  TaskStatus,
  ToastItem,
} from "@/types";

function normalizeEmployee(raw: unknown): DashboardEmployee {
  const r = raw as Record<string, unknown>;
  const id = String(r._id ?? "");
  const name = String(r.name ?? "");
  const role = String(r.role ?? "Employee");
  const department = r.department != null ? String(r.department) : undefined;
  const activity = Number(r.activity ?? 0);
  const es = r.employmentStatus;
  let employmentStatus: DashboardEmployee["employmentStatus"] = "Active";
  if (es === "On Leave" || department === "On Leave") employmentStatus = "On Leave";
  else if (es === "Inactive") employmentStatus = "Inactive";
  else if (es === "Offline") employmentStatus = "Offline";
  else if (es === "Active") employmentStatus = "Active";
  return { id, name, role, department, employmentStatus, activity };
}

function normalizeProject(raw: unknown): DashboardProject {
  const r = raw as Record<string, unknown>;
  const id = String(r._id ?? "");
  const name = String(r.name ?? "");
  const description = String(r.description ?? "");
  const progress = Math.min(100, Math.max(0, Number(r.progress ?? 0)));
  const st = r.status;
  const status: DashboardProject["status"] =
    st === "In Progress" || st === "Completed" || st === "Pending"
      ? (st as DashboardProject["status"])
      : "Pending";
  let deadline: string | null = null;
  if (r.deadline) {
    try {
      deadline = new Date(String(r.deadline)).toISOString();
    } catch {
      deadline = null;
    }
  }
  const rawEmps = r.assignedEmployees;
  const assignedEmployees: DashboardProject["assignedEmployees"] = Array.isArray(rawEmps)
    ? rawEmps.map((e) => {
        const x = e as Record<string, unknown>;
        return {
          id: String(x._id ?? x.id ?? ""),
          name: String(x.name ?? ""),
          role: String(x.role ?? ""),
        };
      })
    : [];
  return { id, name, description, status, deadline, progress, assignedEmployees };
}

const API = "http://localhost:5000/api";
const LS = {
  tasks: "pm_tasks_modern_v1",
  activities: "pm_activities_v1",
  auth: "pm_auth_modern_v1",
  theme: "pm_theme_modern_v1",
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const seedTasks: Task[] = [
  {
    id: uid(),
    title: "Design system audit",
    description: "Review components and tokens for the new dashboard.",
    priority: "high",
    status: "in_progress",
    progress: 45,
    deadline: new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10),
    assignee: "You",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uid(),
    title: "API integration",
    description: "Wire axios polling and error states.",
    priority: "medium",
    status: "todo",
    progress: 0,
    deadline: new Date(Date.now() + 864e5 * 5).toISOString().slice(0, 10),
    assignee: "Team",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uid(),
    title: "Ship MVP",
    description: "Polish animations and empty states.",
    priority: "urgent",
    status: "done",
    progress: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

interface AuthState {
  loggedIn: boolean;
  email: string;
  name: string;
}

interface DashboardValue {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activities: ActivityItem[];
  auth: AuthState;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toasts: ToastItem[];
  pushToast: (message: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;
  notifications: { id: string; text: string; at: number; read: boolean }[];
  addNotification: (text: string) => void;
  markAllNotificationsRead: () => void;
  loading: boolean;
  backendOk: boolean;
  netOnline: boolean;
  projectsRemote: { id: string; name: string; progress: number; status: string }[];
  employeesRemote: DashboardEmployee[];
  projectsDetailRemote: DashboardProject[];
  search: string;
  setSearch: (s: string) => void;
  filterPriority: "all" | Task["priority"];
  setFilterPriority: (p: "all" | Task["priority"]) => void;
  filterStatus: "all" | TaskStatus;
  setFilterStatus: (s: "all" | TaskStatus) => void;
  filterDeadline: "all" | "overdue" | "week";
  setFilterDeadline: (d: "all" | "overdue" | "week") => void;
  addTask: (t: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  logActivity: (label: string, detail: string) => void;
  refreshRemote: (opts?: { silent?: boolean; toast?: boolean }) => Promise<void>;
}

const Ctx = createContext<DashboardValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => loadJson<Task[]>(LS.tasks, seedTasks));
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    loadJson<ActivityItem[]>(LS.activities, [])
  );
  const [auth, setAuth] = useState<AuthState>(() =>
    loadJson<AuthState>(LS.auth, { loggedIn: false, email: "", name: "" })
  );
  const [theme, setThemeState] = useState<"light" | "dark">(() =>
    loadJson<"light" | "dark">(LS.theme, "light")
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<
    { id: string; text: string; at: number; read: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [netOnline, setNetOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [projectsRemote, setProjectsRemote] = useState<
    { id: string; name: string; progress: number; status: string }[]
  >([]);
  const [employeesRemote, setEmployeesRemote] = useState<DashboardEmployee[]>([]);
  const [projectsDetailRemote, setProjectsDetailRemote] = useState<DashboardProject[]>([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | Task["priority"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [filterDeadline, setFilterDeadline] = useState<"all" | "overdue" | "week">("all");

  const pushToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback((text: string) => {
    const id = uid();
    setNotifications((prev) => [{ id, text, at: Date.now(), read: false }, ...prev].slice(0, 30));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const logActivity = useCallback((label: string, detail: string) => {
    setActivities((prev) => [{ id: uid(), label, detail, at: Date.now() }, ...prev].slice(0, 80));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS.tasks, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(LS.activities, JSON.stringify(activities));
  }, [activities]);
  useEffect(() => {
    localStorage.setItem(LS.auth, JSON.stringify(auth));
  }, [auth]);
  useEffect(() => {
    localStorage.setItem(LS.theme, JSON.stringify(theme));
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((t: "light" | "dark") => {
    setThemeState(t);
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      if (!email.includes("@") || !email.includes(".")) {
        pushToast("Invalid email format", "error");
        return false;
      }
      if (password.length < 4) {
        pushToast("Password must be at least 4 characters", "error");
        return false;
      }
      if (email === "admin@gmail.com" && password === "admin") {
        setAuth({ loggedIn: true, email, name: "Admin" });
        pushToast("Welcome back", "success");
        logActivity("Login", email);
        return true;
      }
      pushToast("Invalid credentials", "error");
      return false;
    },
    [logActivity, pushToast]
  );

  const signup = useCallback(
    (name: string, email: string, password: string) => {
      if (!name.trim() || !email || !password) {
        pushToast("All fields are required", "error");
        return false;
      }
      if (!email.includes("@") || !email.includes(".")) {
        pushToast("Invalid email format", "error");
        return false;
      }
      if (password.length < 4) {
        pushToast("Password must be at least 4 characters", "error");
        return false;
      }
      setAuth({ loggedIn: true, email, name: name.trim() });
      pushToast("Account created", "success");
      logActivity("Signup", email);
      return true;
    },
    [logActivity, pushToast]
  );

  const logout = useCallback(() => {
    setAuth({ loggedIn: false, email: "", name: "" });
    pushToast("Logged out", "info");
  }, [pushToast]);

  const addTask = useCallback(
    (t: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const newTask: Task = {
        ...t,
        id: uid(),
        createdAt: now,
        updatedAt: now,
      };
      setTasks((prev) => [newTask, ...prev]);
      pushToast("Task added", "success");
      addNotification(`New task: ${newTask.title}`);
      logActivity("Task created", newTask.title);
    },
    [addNotification, logActivity, pushToast]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x))
      );
      pushToast("Task updated", "success");
      logActivity("Task updated", patch.title || id);
    },
    [logActivity, pushToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((x) => x.id !== id));
      pushToast("Task deleted", "info");
      logActivity("Task deleted", id);
    },
    [logActivity, pushToast]
  );

  const moveTask = useCallback(
    (id: string, status: TaskStatus) => {
      setTasks((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                status,
                progress: status === "done" ? 100 : status === "todo" ? Math.min(x.progress, 30) : x.progress,
                updatedAt: Date.now(),
              }
            : x
        )
      );
      pushToast("Status updated", "success");
    },
    [pushToast]
  );

  const refreshRemote = useCallback(
    async (opts?: { silent?: boolean; toast?: boolean }) => {
      if (!auth.loggedIn || (typeof navigator !== "undefined" && !navigator.onLine)) return;
      const silent = opts?.silent ?? true;
      if (!silent) setLoading(true);
      try {
        const [empRes, prRes] = await Promise.all([
          axios.get(`${API}/employees`),
          axios.get(`${API}/projects`),
        ]);
        const employeesNorm = ((empRes.data as unknown[]) ?? []).map(normalizeEmployee);
        const projectsNorm = ((prRes.data as unknown[]) ?? []).map(normalizeProject);
        setEmployeesRemote(employeesNorm);
        setProjectsDetailRemote(projectsNorm);
        const rows = projectsNorm.map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.progress,
          status: p.status,
        }));
        setProjectsRemote(rows);
        setBackendOk(true);
        if (opts?.toast) pushToast("Data refreshed", "success");
      } catch {
        setBackendOk(false);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [auth.loggedIn, pushToast]
  );

  const refreshRef = useRef(refreshRemote);
  refreshRef.current = refreshRemote;

  useEffect(() => {
    const up = () => {
      setNetOnline(true);
      void refreshRef.current({ silent: true });
    };
    const down = () => {
      setNetOnline(false);
    };
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    if (!auth.loggedIn) return;
    void refreshRemote({ silent: true });
    const id = window.setInterval(() => {
      void refreshRef.current({ silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [auth.loggedIn, refreshRemote]);

  const value = useMemo<DashboardValue>(
    () => ({
      tasks,
      setTasks,
      activities,
      auth,
      login,
      signup,
      logout,
      theme,
      setTheme,
      toasts,
      pushToast,
      dismissToast,
      notifications,
      addNotification,
      markAllNotificationsRead,
      loading,
      backendOk,
      netOnline,
      projectsRemote,
      employeesRemote,
      projectsDetailRemote,
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
      moveTask,
      logActivity,
      refreshRemote,
    }),
    [
      tasks,
      activities,
      auth,
      login,
      signup,
      logout,
      theme,
      setTheme,
      toasts,
      pushToast,
      dismissToast,
      notifications,
      addNotification,
      markAllNotificationsRead,
      loading,
      backendOk,
      netOnline,
      projectsRemote,
      employeesRemote,
      projectsDetailRemote,
      search,
      filterPriority,
      filterStatus,
      filterDeadline,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      logActivity,
      refreshRemote,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboard must be used within DashboardProvider");
  return v;
}
