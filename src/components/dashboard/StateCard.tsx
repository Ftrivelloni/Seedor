import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/dashboard/ui/card';

interface StateCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  iconColor?: string;
}

export function StateCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-green-600',
}: StateCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <p
                className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {trend.value}
              </p>
            )}
          </div>
          <div
            className={`rounded-lg bg-gray-50 p-3 ${iconColor}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
