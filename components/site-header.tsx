import Link from "next/link";
import { ChartCandlestick } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", key: "overview" },
  { href: "/cash-flow", label: "Cash Flow", key: "cashflow" },
] as const;

export type SiteHeaderActive = (typeof links)[number]["key"];

export function SiteHeader({
  active,
  action,
  user,
}: {
  active: SiteHeaderActive;
  action?: React.ReactNode;
  user?: { username: string; email: string };
}) {
  // No backdrop-filter here: blur on a sticky element hits a Chromium
  // compositing bug where the header visually detaches while scrolling.
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3.5 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground shadow-sm">
              <ChartCandlestick className="size-5" strokeWidth={2.2} />
            </div>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">
              Trade Journal
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-3.5",
                  active === link.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {action}
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
