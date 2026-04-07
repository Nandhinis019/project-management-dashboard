import * as React from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";

export function AuthView() {
  const { login, signup } = useDashboard();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") login(email, password);
    else signup(name, email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-panel overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-indigo-500/10 dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Hub</h1>
              <p className="text-sm text-slate-500">Sign in to continue</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="group relative">
                <Input
                  id="name"
                  className="peer pt-5"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
                <Label
                  htmlFor="name"
                  className={cn(
                    "absolute left-3 top-3 z-10 text-slate-500 transition-all duration-200",
                    "peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-indigo-600",
                    "peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[11px]"
                  )}
                >
                  Full name
                </Label>
              </div>
            )}
            <div className="relative">
              <Input
                id="email"
                type="email"
                className="peer pt-5"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Label
                htmlFor="email"
                className={cn(
                  "absolute left-3 top-3 z-10 text-slate-500 transition-all duration-200",
                  "peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-indigo-600",
                  "peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[11px]"
                )}
              >
                Email
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                className="peer pt-5 pr-11"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <Label
                htmlFor="password"
                className={cn(
                  "absolute left-3 top-3 z-10 text-slate-500 transition-all duration-200",
                  "peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-indigo-600",
                  "peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[11px]"
                )}
              >
                Password
              </Label>
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-[18px] text-slate-400 transition-colors hover:text-indigo-600"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" className="mt-2 w-full" size="lg">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "No account?" : "Have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-slate-400">Demo: admin@gmail.com / admin</p>
        </div>
      </motion.div>
    </div>
  );
}
