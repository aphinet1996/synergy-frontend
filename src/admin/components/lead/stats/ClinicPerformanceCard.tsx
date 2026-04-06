import type { LeadClinicStat } from '@/types/externalLeads';
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
import { Building2 } from 'lucide-react';

interface ClinicPerformanceCardProps {
    clinics: LeadClinicStat[];
}

export default function ClinicPerformanceCard({ clinics }: ClinicPerformanceCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5 text-green-600" />
                    ผลงานตามคลินิก
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>คลินิก</TableHead>
                            <TableHead>สาขา</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">มาตามนัด</TableHead>
                            <TableHead className="text-right">อัตราการมา</TableHead>
                            <TableHead className="text-right">รายได้</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clinics.map((clinic) => (
                            <TableRow key={`${clinic.clinicId}-${clinic.branch}`}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-gray-100">
                                            {clinic.clinicId}
                                        </Badge>
                                        <span className="font-medium">{clinic.clinicName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-600">{clinic.branch}</TableCell>
                                <TableCell className="text-right">{formatNumber(clinic.total)}</TableCell>
                                <TableCell className="text-right text-green-600">
                                    {formatNumber(clinic.arrived)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant="outline"
                                        className={clinic.conversionRate >= 50 ? 'text-green-600' : 'text-yellow-600'}
                                    >
                                        {formatPercent(clinic.conversionRate)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(clinic.revenue)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {clinics.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                    ไม่มีข้อมูลคลินิก
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}