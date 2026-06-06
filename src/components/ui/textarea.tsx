import * as React from "react"
import { cn } from "~/lib/utils"

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full resize-y border border-line bg-surface px-3 py-3 text-base outline-none transition focus:ring-2 focus:ring-sun",
      className
    )}
    {...props}
  />
))

Textarea.displayName = "Textarea"
