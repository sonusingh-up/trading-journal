import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeadingSkeleton,
  PanelCardSkeleton,
  StatCardSkeleton,
  TableCardSkeleton,
} from "@/components/skeletons";
import { SiteHeader } from "@/components/site-header";

export default function CashFlowLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        active="cashflow"
        action={<Skeleton className="h-9 w-28 rounded-full" />}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <PageHeadingSkeleton />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        <div className="mt-6">
          <PanelCardSkeleton bodyClassName="h-[320px]" />
        </div>

        <div className="mt-10">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 mb-4 h-4 w-52" />
          <TableCardSkeleton rows={5} />
        </div>
      </main>
    </div>
  );
}
