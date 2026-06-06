import * as React from "react"
import { cn } from "~/lib/utils"

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-line bg-surface shadow-[6px_6px_0_#171717]", className)}
      {...props}
    />
  )
}
