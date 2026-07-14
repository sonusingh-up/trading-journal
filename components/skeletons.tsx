import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeadingSkeleton() {
  return (
    <div className="pt-10 pb-8">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-2.5 h-4 w-60" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="py-5">
      <CardContent className="px-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2.5 h-7 w-32" />
        <Skeleton className="mt-2.5 h-3 w-28" />
      </CardContent>
    </Card>
  );
}

/** Mirrors a data-table card: header strip plus striped rows. */
export function TableCardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="py-0">
      <div className="px-6 py-4">
        <div className="flex items-center gap-6 border-b border-border/60 pb-3.5">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="hidden h-3.5 w-16 sm:block" />
          <Skeleton className="ml-auto h-3.5 w-16" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-b border-border/40 py-3.5 last:border-0"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Generic content card: title lines plus a body block (chart, list, panel). */
export function PanelCardSkeleton({
  bodyClassName = "h-48",
}: {
  bodyClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-1.5 h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className={bodyClassName} />
      </CardContent>
    </Card>
  );
}
