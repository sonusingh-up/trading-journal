import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Zero-state panel: subtle icon, short title, one-line guidance. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-3.5 flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.8} />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
