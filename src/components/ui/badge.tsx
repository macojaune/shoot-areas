import { Slot } from "@radix-ui/react-slot"
import { cn } from "~/lib/utils"

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  asChild?: boolean
}

export function Badge({
  className,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold leading-none",
        asChild && "filter-feedback focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
        className
      )}
      {...props}
    />
  )
}
