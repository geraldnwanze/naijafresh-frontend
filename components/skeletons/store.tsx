import { ProductCardSkeleton, Skeleton } from "@/components/ui/states";
import {
  CardListSkeleton,
  FormSkeleton,
  LoadingRegion,
  PillsSkeleton,
  ProductGridSkeleton,
  SummarySkeleton,
  TitleSkeleton,
} from "@/components/ui/skeletons";

// Page-shaped skeletons for the storefront. Each mirrors the layout of the page
// it stands in for (same containers, grids and rough heights) so nothing jumps
// when the real content arrives. They are used by the route `loading.tsx` files.

const card = "rounded-card border border-black/5 bg-white";

export function HomeSkeleton() {
  return (
    <LoadingRegion label="Loading the shop…">
      <section className="border-b border-black/5 bg-gradient-to-b from-brand-50 to-cream-100">
        <div className="container-page grid gap-8 py-10 md:grid-cols-2 md:items-center md:py-12">
          <div>
            <Skeleton className="h-7 w-52 rounded-full" />
            <Skeleton className="mt-5 h-10 w-full max-w-md" />
            <Skeleton className="mt-3 h-10 w-4/5 max-w-sm" />
            <Skeleton className="mt-5 h-5 w-full max-w-md" />
            <Skeleton className="mt-2 h-5 w-3/5 max-w-xs" />
            <div className="mt-7 flex gap-3">
              <Skeleton className="h-12 w-48 rounded-full" />
              <Skeleton className="h-12 w-40 rounded-full" />
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-sm grid-cols-6 gap-2 md:ml-auto md:mr-0 md:max-w-md md:grid-cols-3 md:gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className={`aspect-square rounded-card ${i % 3 === 1 ? "md:translate-y-3" : ""}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <Skeleton className="h-7 w-48" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${card} flex flex-col items-center gap-2 p-4`}>
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-page">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

/** The shop and category pages: heading, filter chips, product grid. */
export function ShopSkeleton({ filters = true }: { filters?: boolean }) {
  return (
    <LoadingRegion label="Loading products…" className="container-page py-8">
      <TitleSkeleton className="mb-6" />
      {filters && (
        <div className="space-y-4">
          <PillsSkeleton count={7} />
          <PillsSkeleton count={4} />
        </div>
      )}
      <div className="mt-6">
        <ProductGridSkeleton count={8} />
      </div>
    </LoadingRegion>
  );
}

export function ProductDetailSkeleton() {
  return (
    <LoadingRegion label="Loading the product…" className="container-page py-8">
      <Skeleton className="mb-4 h-4 w-56" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-card" />
        <div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-9 w-4/5" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className={`${card} mt-6 space-y-4 p-5`}>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-11 w-40 rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

export function OrdersSkeleton() {
  return (
    <LoadingRegion label="Loading your orders…" className="container-page py-8">
      <Skeleton className="mb-6 h-8 w-40" />
      <CardListSkeleton rows={4} />
    </LoadingRegion>
  );
}

export function OrderDetailSkeleton() {
  return (
    <LoadingRegion label="Loading the order…" className="container-page py-8">
      <TitleSkeleton className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className={`${card} flex justify-between gap-3 p-5`}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className={`${card} space-y-4 p-5`}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
        <SummarySkeleton lines={5} />
      </div>
    </LoadingRegion>
  );
}

export function CartSkeleton() {
  return (
    <LoadingRegion label="Loading your cart…" className="container-page py-8">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className={`${card} divide-y divide-black/5`}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-16 w-16 shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          ))}
        </div>
        <SummarySkeleton lines={3} />
      </div>
    </LoadingRegion>
  );
}

export function CheckoutSkeleton() {
  return (
    <LoadingRegion label="Loading checkout…" className="container-page py-8">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <FormSkeleton fields={4} />
          <FormSkeleton fields={3} />
        </div>
        <SummarySkeleton lines={4} />
      </div>
    </LoadingRegion>
  );
}

export function AccountSkeleton() {
  return (
    <LoadingRegion label="Loading your account…" className="container-page py-8">
      <Skeleton className="mb-6 h-8 w-44" />
      <div className="grid gap-6 lg:grid-cols-2">
        <FormSkeleton fields={3} />
        <div className="space-y-3">
          <CardListSkeleton rows={2} />
        </div>
      </div>
    </LoadingRegion>
  );
}
