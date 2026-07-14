import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelCardSkeleton, StatCardSkeleton } from "@/components/skeletons";
import { SiteHeader } from "@/components/site-header";

export default function OverviewLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        active="overview"
        action={<Skeleton className="h-9 w-28 rounded-full" />}
      />

      <main className="mx-auto w-full max-w-[1060px] flex-1 px-4 pb-16">
        <div className="flex flex-col items-center pt-9 pb-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-3 w-24" />
          <Skeleton className="mt-2.5 h-11 w-56 rounded-xl" />
          <Skeleton className="mt-2.5 h-6 w-44 rounded-full" />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <PanelCardSkeleton bodyClassName="h-24" />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="py-4">
                  <CardContent className="px-4">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-8 rounded-xl" />
                      <div className="flex-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="mt-1.5 h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="mt-3 h-6 w-28" />
                    <Skeleton className="mt-1.5 h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <PanelCardSkeleton bodyClassName="h-64" />
          </div>

          <div className="flex flex-col gap-5">
            <PanelCardSkeleton bodyClassName="h-24" />
            <PanelCardSkeleton bodyClassName="h-80" />
          </div>
        </div>
      </main>
    </div>
  );
}
