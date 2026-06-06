import * as React from "react"
import { cn } from "~/lib/utils"

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full border border-line bg-surface px-3 text-base outline-none transition focus:ring-2 focus:ring-sun",
      className
    )}
    {...props}
  />
))

Input.displayName = "Input"
