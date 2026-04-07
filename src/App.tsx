import { useCallback, useState } from "react";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import { AuthView } from "./components/AuthView";
import { AppShell } from "./components/AppShell";
import { DashboardHome } from "./components/DashboardHome";
import { TasksPage } from "./components/TasksPage";
import { CalendarView } from "./components/CalendarView";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { ToastStack } from "./components/ToastStack";

type NavId = "dashboard" | "tasks" | "calendar" | "activity";

function AppRoutes() {
  const { auth } = useDashboard();
  const [nav, setNav] = useState<NavId>("dashboard");
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);

  const onNewTask = useCallback(() => {
    setNav("tasks");
    setTaskCreateOpen(true);
  }, []);

  const onNavigate = useCallback((id: NavId) => {
    setNav(id);
    if (id !== "tasks") setTaskCreateOpen(false);
  }, []);

  if (!auth.loggedIn) {
    return (
      <>
        <ToastStack />
        <AuthView />
      </>
    );
  }

  return (
    <>
      <ToastStack />
      <AppShell active={nav} onNavigate={onNavigate} onNewTask={onNewTask}>
        {nav === "dashboard" && <DashboardHome />}
        {nav === "tasks" && (
          <TasksPage createOpen={taskCreateOpen} onCreateOpenChange={setTaskCreateOpen} />
        )}
        {nav === "calendar" && <CalendarView />}
        {nav === "activity" && <ActivityTimeline />}
      </AppShell>
    </>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <AppRoutes />
    </DashboardProvider>
  );
}
