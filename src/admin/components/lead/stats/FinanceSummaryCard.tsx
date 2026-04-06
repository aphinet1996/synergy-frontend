import type { LeadFinanceStats } from '@/types/externalLeads';
import { formatCurrency, formatNumber } from '../../../utils/statsHelper';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface FinanceSummaryCardProps {
    finance: LeadFinanceStats | null;
}

export default function FinanceSummaryCard({ finance }: FinanceSummaryCardProps) {
    const gridItems = [
        { label: 'รายได้รวม', value: formatCurrency(finance?.totalRevenue), color: 'text-gray-900' },
        { label: 'รายได้สุทธิ', value: formatCurrency(finance?.totalNetRevenue), color: 'text-green-600' },
        { label: 'ค่าคอมมิชชั่น', value: formatCurrency(finance?.totalCommission), color: 'text-orange-600' },
        { label: 'ค่าบริการ', value: formatCurrency(finance?.totalServiceCharge), color: 'text-purple-600' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    สรุปการเงิน
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {gridItems.map((item) => (
                        <div key={item.label} className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">{item.label}</p>
                            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">จำนวนธุรกรรม</span>
                        <span className="font-medium">{formatNumber(finance?.transactionCount)} รายการ</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-500">ธุรกรรมเฉลี่ย</span>
                        <span className="font-medium">{formatCurrency(finance?.avgTransaction)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}