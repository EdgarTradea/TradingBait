import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
}

// Memoize KpiCard to prevent unnecessary re-renders
export const KpiCard = React.memo(({ title, value, description }: KpiCardProps) => (
  <Card className="bg-gray-900/50 border-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </CardContent>
  </Card>
));

KpiCard.displayName = 'KpiCard';;
