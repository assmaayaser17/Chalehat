import { Skeleton } from "@/components/ui/skeleton";

export default function ChaletDetailLoading() {
  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-80 w-full lg:col-span-1" />
      </div>
    </div>
  );
}
