import { Skeleton } from "@/components/ui/states";
import {
  CardListSkeleton,
  FormSkeleton,
  LoadingRegion,
  StatCardsSkeleton,
  TableSkeleton,
  TitleSkeleton,
} from "@/components/ui/skeletons";

// Skeletons for the admin area. The admin pages are client components that fetch
// after mounting, so these replace the old spinner and also back `loading.tsx`.

const card = "rounded-card border border-black/5 bg-white";

/** Heading, optional KPI tiles, then a table. The default for any admin page. */
export function AdminPageSkeleton({ stats = 0, rows = 8, cols = 5 }: { stats?: number; rows?: number; cols?: number }) {
  return (
    <LoadingRegion label="Loading…">
      <TitleSkeleton className="mb-5" />
      {stats > 0 && (
        <div className="mb-5">
          <StatCardsSkeleton count={stats} />
        </div>
      )}
      <TableSkeleton rows={rows} cols={cols} />
    </LoadingRegion>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <LoadingRegion label="Loading the dashboard…">
      <Skeleton className="mb-5 h-8 w-44" />
      <StatCardsSkeleton count={4} />
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-3">
        <TableSkeleton rows={6} cols={4} />
      </div>
    </LoadingRegion>
  );
}

export function AdminFormPageSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <LoadingRegion label="Loading…">
      <TitleSkeleton className="mb-5" />
      <FormSkeleton fields={fields} className="max-w-2xl" />
    </LoadingRegion>
  );
}

export function AdminAccountingSkeleton() {
  return (
    <LoadingRegion label="Crunching the numbers…">
      <div className="mt-5">
        <StatCardsSkeleton count={4} />
      </div>
      <div className={`${card} mt-5 p-5`}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-56 w-full" />
      </div>
      <div className="mt-5">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </LoadingRegion>
  );
}

export function AdminOrderSkeleton() {
  return (
    <LoadingRegion label="Loading the order…">
      <TitleSkeleton className="mb-5" />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <TableSkeleton rows={3} cols={4} />
          <CardListSkeleton rows={2} />
        </div>
        <FormSkeleton fields={3} />
      </div>
    </LoadingRegion>
  );
}

/** Full-screen stand-in for the admin chrome while we check who is signed in. */
export function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-cream-100 md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-black/5 bg-white p-4 md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <main className="p-4 md:p-6">
        <AdminDashboardSkeleton />
      </main>
    </div>
  );
}

/** The system overview: KPI tiles, two small cards, then a list. (The page title comes from the layout.) */
export function SystemOverviewSkeleton() {
  return (
    <LoadingRegion label="Loading…">
      <StatCardsSkeleton count={5} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FormSkeleton fields={2} />
        <FormSkeleton fields={2} />
      </div>
      <div className="mt-6">
        <TableSkeleton rows={4} cols={4} />
      </div>
    </LoadingRegion>
  );
}
