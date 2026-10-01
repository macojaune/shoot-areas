import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "button-feedback data-[transitioning]:bg-sun data-[transitioning]:text-ink data-[transitioning]:cursor-progress inline-flex shrink-0 items-center justify-center gap-2 border border-line font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-sun hover:text-ink focus-visible:bg-sun focus-visible:text-ink active:bg-sun active:text-ink",
        secondary: "bg-sun text-ink hover:bg-sun focus-visible:bg-sun active:bg-sun",
        outline: "bg-surface text-ink hover:bg-sun focus-visible:bg-sun active:bg-sun",
        ghost: "border-transparent bg-transparent text-ink hover:bg-sun/25 focus-visible:bg-sun/25 active:bg-sun",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-13 px-6 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
