import * as React from "react"

import { cn } from "~/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full border bg-transparent px-3 py-1 text-sm transition-colors" +
            " file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground" +
            " focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-l/support" +
            " disabled:cursor-not-allowed" +
            " disabled:opacity-50",
          error ? "border-destructive" : "border-l/support",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
