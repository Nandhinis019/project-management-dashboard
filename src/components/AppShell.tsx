import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Command,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  Sun,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";

const nav = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks" as const, label: "Tasks", icon: ListTodo },
  { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
  { id: "activity" as const, label: "Activity", icon: Command },
];

export function AppShell({
  children,
  active,
  onNavigate,
  onNewTask,
}: {
  children: React.ReactNode;
  active: (typeof nav)[number]["id"];
  onNavigate: (id: (typeof nav)[number]["id"]) => void;
  onNewTask: () => void;
}) {
  const {
    auth,
    theme,
    setTheme,
    search,
    setSearch,
    notifications,
    markAllNotificationsRead,
    netOnline,
    backendOk,
    refreshRemote,
    loading,
    logout,
  } = useDashboard();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ptrRef = useRef<{ startY: number; pulling: boolean }>({ startY: 0, pulling: false });
  const mainRef = useRef<HTMLDivElement>(null);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "n" && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        onNewTask();
      }
      if (e.key === "d" && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        setTheme(theme === "light" ? "dark" : "light");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNewTask, setTheme, theme]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!mainRef.current || window.scrollY > 10) return;
    ptrRef.current = { startY: e.touches[0].clientY, pulling: true };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!ptrRef.current.pulling) return;
    const dy = e.touches[0].clientY - ptrRef.current.startY;
    if (dy > 80) {
      void refreshRemote({ silent: false, toast: true });
      ptrRef.current.pulling = false;
    }
  };
  const onTouchEnd = () => {
    ptrRef.current.pulling = false;
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Project Hub</p>
              <p className="text-[10px] text-slate-500">Workspace</p>
            </div>
          </div>

          <div className="relative min-w-[200px] flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="global-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks… (⌘K)"
              className="pl-10"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex",
                netOnline ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-rose-100 text-rose-800"
              )}
            >
              {netOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {netOnline ? "Online" : "Offline"}
            </span>
            <span
              className={cn(
                "hidden rounded-full px-2 py-1 text-[10px] font-semibold md:inline",
                backendOk ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200" : "bg-amber-100 text-amber-900"
              )}
            >
              API {backendOk ? "live" : "local"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={loading}
              onClick={() => void refreshRemote({ silent: false, toast: true })}
              className="gap-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>

            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-2 py-1 dark:border-slate-700 dark:bg-slate-900/80">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
            </div>

            <div className="relative">
              <Button
                variant="secondary"
                size="icon"
                type="button"
                className="relative"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Notifications</span>
                      <button type="button" className="text-[10px] text-indigo-600 hover:underline" onClick={() => markAllNotificationsRead()}>
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "border-b border-slate-50 px-3 py-2 text-xs dark:border-slate-800",
                              !n.read && "bg-indigo-50/80 dark:bg-indigo-950/40"
                            )}
                          >
                            <p className="text-slate-800 dark:text-slate-100">{n.text}</p>
                            <p className="text-[10px] text-slate-400">{new Date(n.at).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <Button variant="secondary" type="button" className="gap-2 px-2" onClick={() => setProfileOpen((v) => !v)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                  {(auth.name || auth.email || "U").slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden max-w-[100px] truncate text-xs font-medium md:inline">{auth.name || "User"}</span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{auth.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{auth.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                    >
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <nav className="border-t border-white/30 bg-white/40 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-2 py-2 md:px-4">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main
        ref={mainRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="ptr-touch mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <p className="mt-8 text-center text-[10px] text-slate-400">
          Shortcuts: <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">N</kbd> new task ·{" "}
          <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">D</kbd> theme ·{" "}
          <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">⌘K</kbd> search · Pull down on mobile to refresh
        </p>
      </main>
    </div>
  );
}
