import type { LeadOverviewStats, LeadFinanceStats } from '@/types/externalLeads';
import { formatCurrency, formatNumber, formatPercent } from '../../../utils/statsHelper';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle2, Target, DollarSign } from 'lucide-react';

interface StatsOverviewCardsProps {
    overview: LeadOverviewStats | null;
    finance: LeadFinanceStats | null;
    conversionRate: number;
}

export default function StatsOverviewCards({
    overview,
    finance,
    conversionRate,
}: StatsOverviewCardsProps) {
    const cards = [
        {
            label: 'Leads ทั้งหมด',
            value: formatNumber(overview?.total),
            valueClass: 'text-gray-900',
            icon: Users,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            label: 'มาตามนัด',
            value: formatNumber(overview?.arrived),
            valueClass: 'text-green-600',
            icon: CheckCircle2,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
        },
        {
            label: 'อัตราการมา',
            value: formatPercent(conversionRate),
            valueClass: 'text-purple-600',
            icon: Target,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            progress: conversionRate,
        },
        {
            label: 'รายได้รวม',
            value: formatCurrency(finance?.totalRevenue),
            valueClass: 'text-orange-600',
            valueSize: 'text-2xl',
            icon: DollarSign,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <Card key={card.label}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{card.label}</p>
                                <p className={`${card.valueSize || 'text-3xl'} font-bold ${card.valueClass}`}>
                                    {card.value}
                                </p>
                            </div>
                            <div className={`p-3 ${card.iconBg} rounded-full`}>
                                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                            </div>
                        </div>
                        {card.progress !== undefined && (
                            <Progress value={card.progress} className="mt-3" />
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}