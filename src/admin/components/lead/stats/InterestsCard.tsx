import type { LeadInterestStat } from '@/types/externalLeads';
import { formatNumber } from '../../../utils/statsHelper';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface InterestsCardProps {
    interests: LeadInterestStat[];
}

export default function InterestsCard({ interests }: InterestsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-purple-600" />
                    ความสนใจยอดนิยม
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {interests.slice(0, 10).map((interest, index) => (
                        <div key={interest.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400 w-5">#{index + 1}</span>
                                <span className="text-sm">{interest.name}</span>
                            </div>
                            <Badge variant="outline">{formatNumber(interest.count)}</Badge>
                        </div>
                    ))}
                    {interests.length === 0 && (
                        <p className="text-center text-gray-500 py-4">ไม่มีข้อมูล</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}