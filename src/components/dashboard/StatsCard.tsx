
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  color?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  color = "primary",
  className,
}: StatsCardProps) {
  const getIconClass = () => {
    switch (color) {
      case "warning":
        return "bg-wp-warning/10 text-wp-warning";
      case "error":
        return "bg-wp-error/10 text-wp-error";
      case "success":
        return "bg-wp-success/10 text-wp-success";
      default:
        return "bg-wp-primary/10 text-wp-primary";
    }
  };

  return (
    <Card className={cn("transition-all-medium card-hover", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-8 w-8 flex items-center justify-center rounded-full", getIconClass())}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p
            className={cn(
              "mt-1 text-xs",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
            {trend.label || (trend.isPositive ? "increase" : "decrease")}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
