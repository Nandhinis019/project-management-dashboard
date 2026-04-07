import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800", className)}
      {...props}
    />
  );
}

export { Skeleton };
