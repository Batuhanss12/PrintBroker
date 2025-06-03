import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  color = "bg-gray-50",
  subtitle,
  trend,
  className
}: StatsCardProps) {
  
  return (
    <Card className={cn("hover:shadow-sm transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          {icon && (
            <div className={cn("p-2 rounded-lg mr-4", color)}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {title}
              </p>
              {trend && (
                <div className={cn(
                  "flex items-center text-xs",
                  trend.direction === 'up' ? "text-green-600" : "text-red-600"
                )}>
                  <span className="mr-1">
                    {trend.direction === 'up' ? '↗' : '↘'}
                  </span>
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
            
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
              </p>
              {subtitle && (
                <p className="text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            
            {trend && (
              <p className="text-xs text-gray-500 mt-1">
                {trend.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
