import type { LeadTrendStat } from '@/types/externalLeads';
import { formatCurrency, formatNumber, formatPercent } from '../../../utils/statsHelper';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';

interface TrendsCardProps {
    trends: LeadTrendStat[];
}

export default function TrendsCard({ trends }: TrendsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    แนวโน้มรายเดือน
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>เดือน</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">มา</TableHead>
                            <TableHead className="text-right">%</TableHead>
                            <TableHead className="text-right">รายได้</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trends.slice(-6).map((trend) => (
                            <TableRow key={trend.period}>
                                <TableCell className="font-medium">{trend.period}</TableCell>
                                <TableCell className="text-right">{formatNumber(trend.total)}</TableCell>
                                <TableCell className="text-right text-green-600">
                                    {formatNumber(trend.arrived)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant="outline"
                                        className={trend.conversionRate >= 50 ? 'text-green-600' : 'text-yellow-600'}
                                    >
                                        {formatPercent(trend.conversionRate)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                    {formatCurrency(trend.revenue)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {trends.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                                    ไม่มีข้อมูล
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}