
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-wp-primary text-white hover:bg-wp-primary/90 shadow-sm",
        destructive:
          "bg-wp-error text-white hover:bg-wp-error/90 shadow-sm",
        outline:
          "border border-wp-border bg-transparent hover:bg-wp-gray-50 text-wp-text-primary",
        secondary:
          "bg-wp-gray-200 text-wp-text-primary hover:bg-wp-gray-300",
        ghost: "hover:bg-wp-gray-100 text-wp-text-secondary hover:text-wp-text-primary",
        link: "text-wp-primary underline-offset-4 hover:underline",
        success: "bg-wp-success text-white hover:bg-wp-success/90 shadow-sm",
        warning: "bg-wp-warning text-white hover:bg-wp-warning/90 shadow-sm",
        "wp-primary": "bg-wp-primary text-white hover:bg-wp-primary/90 shadow-sm",
        "wp-secondary": "bg-wp-gray-200 text-wp-text-primary hover:bg-wp-gray-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-10 rounded px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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

export { Button, buttonVariants }
