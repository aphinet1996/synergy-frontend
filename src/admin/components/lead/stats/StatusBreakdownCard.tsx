import type { LeadOverviewStats } from '@/types/externalLeads';
import { formatNumber, STATUS_ITEMS } from '../../../utils/statsHelper';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    PieChart,
    Clock,
    Calendar,
    RefreshCw,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

const STATUS_ICONS: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    scheduled: <Calendar className="h-4 w-4 text-blue-500" />,
    rescheduled: <RefreshCw className="h-4 w-4 text-purple-500" />,
    arrived: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    cancelled: <XCircle className="h-4 w-4 text-gray-400" />,
};

interface StatusBreakdownCardProps {
    overview: LeadOverviewStats | null;
}

export default function StatusBreakdownCard({ overview }: StatusBreakdownCardProps) {
    const total = overview?.total || 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    สถานะ Leads
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {STATUS_ITEMS.map((item) => {
                    const count = overview?.[item.key as keyof LeadOverviewStats] as number | undefined;
                    const pct = total > 0 && count ? (count / total) * 100 : 0;

                    return (
                        <div key={item.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {STATUS_ICONS[item.key]}
                                <span className="text-sm">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Progress value={pct} className="w-24 h-2" />
                                <span className="text-sm font-medium w-12 text-right">
                                    {formatNumber(count)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}