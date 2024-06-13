import { cn } from "~/lib/utils"
import { useMemo } from "react"

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

const SkeletonCard = ({
  size = "default",
}: {
  size?: "default" | "sm" | "hero"
}) => {
  const sizes = useMemo(() => {
    switch (size) {
      case "sm":
        return "w-[294px] h-[126px]" //{ width: 294, height: 126 }
      case "hero":
        return "h-[424px] w-[424px]"
      default:
        return "h-[400px] w-[400px]" //{ width: 400, height: 400 }
    }
  }, [size])
  return (
    <div className="flex flex-col items-center space-y-2 overflow-hidden">
      <Skeleton className={cn(sizes, "rounded-none")} />
      <div
        className={cn(
          "grid w-full grid-flow-row-dense grid-cols-3 items-center justify-between gap-x-4 lg:px-8 lg:py-6",
          size === "sm" && "lg:px-2"
        )}
      >
        <div className="col-span-2 flex grow flex-col gap-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className={cn(size === "sm" ? "h-6" : "h-full", "")} />
      </div>
    </div>
  )
}
export { Skeleton, SkeletonCard }
