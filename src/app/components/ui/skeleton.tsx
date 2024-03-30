import { cn } from "~/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

const SkeletonCard = () => (
  <div className=" space-y- flex flex-col">
    <Skeleton className="h-[424px] w-[424px] rounded-none" />
    <div className="flex flex-row justify-between gap-x-4 lg:px-8 lg:py-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-[250px]" />
        <Skeleton className="h-3 w-[200px]" />
      </div>
      <Skeleton className="h-full w-full" />
    </div>
  </div>
)
export { Skeleton, SkeletonCard }
