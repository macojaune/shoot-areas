import { cn } from "~/lib/utils"

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-line bg-paper px-3 py-1 text-sm font-semibold",
        className
      )}
      {...props}
    />
  )
}
