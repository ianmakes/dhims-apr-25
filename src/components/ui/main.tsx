
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface MainProps extends HTMLAttributes<HTMLDivElement> {}

export function Main({ className, ...props }: MainProps) {
  return (
    <main 
      className={cn("flex-1 space-y-6", className)}
      {...props} 
    />
  );
}
