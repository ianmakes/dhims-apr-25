
import * as React from "react"
import { cn } from "@/lib/utils"

export interface MainProps extends React.HTMLAttributes<HTMLElement> {}

const Main = React.forwardRef<HTMLElement, MainProps>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn("flex-1 container py-6", className)}
        {...props}
      />
    )
  }
)

Main.displayName = "Main"

export { Main }
