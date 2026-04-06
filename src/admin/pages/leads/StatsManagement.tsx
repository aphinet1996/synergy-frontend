// import { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from '@/components/ui/table';
// import { Progress } from '@/components/ui/progress';
// import {
//     TrendingUp,
//     Users,
//     Building2,
//     DollarSign,
//     Calendar,
//     Filter,
//     RefreshCw,
//     Loader2,
//     AlertCircle,
//     X,
//     Clock,
//     CheckCircle2,
//     XCircle,
//     Target,
//     PieChart,
//     Activity,
// } from 'lucide-react';
// import { format, subMonths } from 'date-fns';
// import { useLeadsStatsStore } from '@/stores/externalLeadsStore';
// import type { StatsParams } from '@/types/externalLeads';

// // ==================== Helper Functions ====================

// const formatCurrency = (amount: number | undefined) => {
//     if (amount === undefined || amount === null) return '฿0';
//     return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
// };

// const formatNumber = (num: number | undefined) => {
//     if (num === undefined || num === null) return '0';
//     return new Intl.NumberFormat('th-TH').format(num);
// };

// const formatPercent = (num: number | undefined) => {
//     if (num === undefined || num === null) return '0%';
//     return `${num}%`;
// };

// // ==================== Component ====================

// export default function LeadsStats() {
//     // Store
//     const overview = useLeadsStatsStore((s) => s.overview);
//     const finance = useLeadsStatsStore((s) => s.finance);
//     const interests = useLeadsStatsStore((s) => s.interests);
//     const trends = useLeadsStatsStore((s) => s.trends);
//     const clinics = useLeadsStatsStore((s) => s.clinics);
//     const isLoading = useLeadsStatsStore((s) => s.isLoading);
//     const error = useLeadsStatsStore((s) => s.error);
//     const fetchAllStats = useLeadsStatsStore((s) => s.fetchAllStats);
//     const clearError = useLeadsStatsStore((s) => s.clearError);

//     // Filter State
//     const [clinicId, setClinicId] = useState<string>('');
//     const [startDate, setStartDate] = useState<string>(() => {
//         return format(subMonths(new Date(), 1), 'yyyy-MM-dd');
//     });
//     const [endDate, setEndDate] = useState<string>(() => {
//         return format(new Date(), 'yyyy-MM-dd');
//     });
//     const [showFilters, setShowFilters] = useState(false);

//     // ==================== Fetch Stats ====================
//     useEffect(() => {
//         const params: StatsParams = {};
//         if (clinicId) params.clinic_id = parseInt(clinicId);
//         if (startDate) params.start_date = startDate;
//         if (endDate) params.end_date = endDate;

//         fetchAllStats(params);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     const handleRefresh = () => {
//         const params: StatsParams = {};
//         if (clinicId) params.clinic_id = parseInt(clinicId);
//         if (startDate) params.start_date = startDate;
//         if (endDate) params.end_date = endDate;

//         fetchAllStats(params);
//     };

//     const handleApplyFilters = () => {
//         handleRefresh();
//     };

//     const handleClearFilters = () => {
//         setClinicId('');
//         setStartDate(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
//         setEndDate(format(new Date(), 'yyyy-MM-dd'));
//         fetchAllStats({});
//     };

//     // ==================== Calculated Values ====================
//     const conversionRate = overview
//         ? overview.total > 0
//             ? Math.round((overview.arrived / overview.total) * 100)
//             : 0
//         : 0;

//     // ==================== Render ====================
//     return (
//         <div className="space-y-6">
//             {/* Error Alert */}
//             {error && (
//                 <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
//                     <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
//                     <span className="text-red-700 flex-1">{error}</span>
//                     <Button variant="ghost" size="sm" onClick={clearError}>
//                         <X className="h-4 w-4" />
//                     </Button>
//                 </div>
//             )}

//             {/* Header */}
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold text-gray-900">สถิติ Leads</h1>
//                     <p className="text-gray-500 mt-1">ภาพรวมข้อมูลและประสิทธิภาพของระบบ Leads</p>
//                 </div>
//                 <div className="flex gap-2">
//                     <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
//                         <Filter className="h-4 w-4 mr-2" />
//                         ตัวกรอง
//                     </Button>
//                     <Button onClick={handleRefresh} disabled={isLoading}>
//                         {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
//                         รีเฟรช
//                     </Button>
//                 </div>
//             </div>

//             {/* Filters */}
//             {showFilters && (
//                 <Card>
//                     <CardContent className="pt-6">
//                         <div className="flex flex-wrap gap-4 items-end">
//                             <div className="space-y-2">
//                                 <Label className="text-xs text-gray-500">Clinic ID</Label>
//                                 <Input
//                                     value={clinicId}
//                                     onChange={(e) => setClinicId(e.target.value)}
//                                     placeholder="ทั้งหมด"
//                                     className="w-[120px]"
//                                 />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label className="text-xs text-gray-500">วันเริ่มต้น</Label>
//                                 <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label className="text-xs text-gray-500">วันสิ้นสุด</Label>
//                                 <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
//                             </div>
//                             <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700">
//                                 ใช้ตัวกรอง
//                             </Button>
//                             <Button variant="ghost" onClick={handleClearFilters}>
//                                 ล้าง
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}

//             {/* Loading State */}
//             {isLoading && (
//                 <div className="flex items-center justify-center h-32">
//                     <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//                     <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
//                 </div>
//             )}

//             {!isLoading && (
//                 <>
//                     {/* Overview Cards */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                         {/* Total Leads */}
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-gray-500">Leads ทั้งหมด</p>
//                                         <p className="text-3xl font-bold text-gray-900">{formatNumber(overview?.total)}</p>
//                                     </div>
//                                     <div className="p-3 bg-blue-100 rounded-full">
//                                         <Users className="h-6 w-6 text-blue-600" />
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Arrived */}
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-gray-500">มาตามนัด</p>
//                                         <p className="text-3xl font-bold text-green-600">{formatNumber(overview?.arrived)}</p>
//                                     </div>
//                                     <div className="p-3 bg-green-100 rounded-full">
//                                         <CheckCircle2 className="h-6 w-6 text-green-600" />
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Conversion Rate */}
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-gray-500">อัตราการมา</p>
//                                         <p className="text-3xl font-bold text-purple-600">{formatPercent(conversionRate)}</p>
//                                     </div>
//                                     <div className="p-3 bg-purple-100 rounded-full">
//                                         <Target className="h-6 w-6 text-purple-600" />
//                                     </div>
//                                 </div>
//                                 <Progress value={conversionRate} className="mt-3" />
//                             </CardContent>
//                         </Card>

//                         {/* Total Revenue */}
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-gray-500">รายได้รวม</p>
//                                         <p className="text-2xl font-bold text-orange-600">{formatCurrency(finance?.totalRevenue)}</p>
//                                     </div>
//                                     <div className="p-3 bg-orange-100 rounded-full">
//                                         <DollarSign className="h-6 w-6 text-orange-600" />
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Status Breakdown & Finance */}
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                         {/* Status Breakdown */}
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2 text-base">
//                                     <PieChart className="h-5 w-5 text-blue-600" />
//                                     สถานะ Leads
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 {/* Pending */}
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <Clock className="h-4 w-4 text-yellow-500" />
//                                         <span className="text-sm">รอดำเนินการ</span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Progress
//                                             value={overview?.total ? (overview.pending / overview.total) * 100 : 0}
//                                             className="w-24 h-2"
//                                         />
//                                         <span className="text-sm font-medium w-12 text-right">{formatNumber(overview?.pending)}</span>
//                                     </div>
//                                 </div>

//                                 {/* Scheduled */}
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <Calendar className="h-4 w-4 text-blue-500" />
//                                         <span className="text-sm">นัดแล้ว</span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Progress
//                                             value={overview?.total ? (overview.scheduled / overview.total) * 100 : 0}
//                                             className="w-24 h-2"
//                                         />
//                                         <span className="text-sm font-medium w-12 text-right">{formatNumber(overview?.scheduled)}</span>
//                                     </div>
//                                 </div>

//                                 {/* Rescheduled */}
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <RefreshCw className="h-4 w-4 text-purple-500" />
//                                         <span className="text-sm">เลื่อนนัด</span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Progress
//                                             value={overview?.total ? (overview.rescheduled / overview.total) * 100 : 0}
//                                             className="w-24 h-2"
//                                         />
//                                         <span className="text-sm font-medium w-12 text-right">{formatNumber(overview?.rescheduled)}</span>
//                                     </div>
//                                 </div>

//                                 {/* Arrived */}
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <CheckCircle2 className="h-4 w-4 text-green-500" />
//                                         <span className="text-sm">มาแล้ว</span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Progress
//                                             value={overview?.total ? (overview.arrived / overview.total) * 100 : 0}
//                                             className="w-24 h-2"
//                                         />
//                                         <span className="text-sm font-medium w-12 text-right">{formatNumber(overview?.arrived)}</span>
//                                     </div>
//                                 </div>

//                                 {/* Cancelled */}
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <XCircle className="h-4 w-4 text-gray-400" />
//                                         <span className="text-sm">ยกเลิก</span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Progress
//                                             value={overview?.total ? (overview.cancelled / overview.total) * 100 : 0}
//                                             className="w-24 h-2"
//                                         />
//                                         <span className="text-sm font-medium w-12 text-right">{formatNumber(overview?.cancelled)}</span>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Financial Summary */}
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2 text-base">
//                                     <DollarSign className="h-5 w-5 text-green-600" />
//                                     สรุปการเงิน
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="p-4 bg-gray-50 rounded-lg">
//                                         <p className="text-xs text-gray-500">รายได้รวม</p>
//                                         <p className="text-lg font-bold text-gray-900">{formatCurrency(finance?.totalRevenue)}</p>
//                                     </div>
//                                     <div className="p-4 bg-gray-50 rounded-lg">
//                                         <p className="text-xs text-gray-500">รายได้สุทธิ</p>
//                                         <p className="text-lg font-bold text-green-600">{formatCurrency(finance?.totalNetRevenue)}</p>
//                                     </div>
//                                     <div className="p-4 bg-gray-50 rounded-lg">
//                                         <p className="text-xs text-gray-500">ค่าคอมมิชชั่น</p>
//                                         <p className="text-lg font-bold text-orange-600">{formatCurrency(finance?.totalCommission)}</p>
//                                     </div>
//                                     <div className="p-4 bg-gray-50 rounded-lg">
//                                         <p className="text-xs text-gray-500">ค่าบริการ</p>
//                                         <p className="text-lg font-bold text-purple-600">{formatCurrency(finance?.totalServiceCharge)}</p>
//                                     </div>
//                                 </div>

//                                 <div className="border-t pt-4">
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-gray-500">จำนวนธุรกรรม</span>
//                                         <span className="font-medium">{formatNumber(finance?.transactionCount)} รายการ</span>
//                                     </div>
//                                     <div className="flex justify-between text-sm mt-2">
//                                         <span className="text-gray-500">ธุรกรรมเฉลี่ย</span>
//                                         <span className="font-medium">{formatCurrency(finance?.avgTransaction)}</span>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Interests & Trends */}
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                         {/* Top Interests */}
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2 text-base">
//                                     <Activity className="h-5 w-5 text-purple-600" />
//                                     ความสนใจยอดนิยม
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <div className="space-y-3">
//                                     {interests.slice(0, 10).map((interest, index) => (
//                                         <div key={interest.name} className="flex items-center justify-between">
//                                             <div className="flex items-center gap-3">
//                                                 <span className="text-sm text-gray-400 w-5">#{index + 1}</span>
//                                                 <span className="text-sm">{interest.name}</span>
//                                             </div>
//                                             <Badge variant="outline">{formatNumber(interest.count)}</Badge>
//                                         </div>
//                                     ))}
//                                     {interests.length === 0 && <p className="text-center text-gray-500 py-4">ไม่มีข้อมูล</p>}
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Monthly Trends */}
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2 text-base">
//                                     <TrendingUp className="h-5 w-5 text-blue-600" />
//                                     แนวโน้มรายเดือน
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <Table>
//                                     <TableHeader>
//                                         <TableRow>
//                                             <TableHead>เดือน</TableHead>
//                                             <TableHead className="text-right">Leads</TableHead>
//                                             <TableHead className="text-right">มา</TableHead>
//                                             <TableHead className="text-right">%</TableHead>
//                                             <TableHead className="text-right">รายได้</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {trends.slice(-6).map((trend) => (
//                                             <TableRow key={trend.period}>
//                                                 <TableCell className="font-medium">{trend.period}</TableCell>
//                                                 <TableCell className="text-right">{formatNumber(trend.total)}</TableCell>
//                                                 <TableCell className="text-right text-green-600">{formatNumber(trend.arrived)}</TableCell>
//                                                 <TableCell className="text-right">
//                                                     <Badge variant="outline" className={trend.conversionRate >= 50 ? 'text-green-600' : 'text-yellow-600'}>
//                                                         {formatPercent(trend.conversionRate)}
//                                                     </Badge>
//                                                 </TableCell>
//                                                 <TableCell className="text-right text-sm">{formatCurrency(trend.revenue)}</TableCell>
//                                             </TableRow>
//                                         ))}
//                                         {trends.length === 0 && (
//                                             <TableRow>
//                                                 <TableCell colSpan={5} className="text-center text-gray-500 py-4">
//                                                     ไม่มีข้อมูล
//                                                 </TableCell>
//                                             </TableRow>
//                                         )}
//                                     </TableBody>
//                                 </Table>
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Clinic Performance */}
//                     <Card>
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2 text-base">
//                                 <Building2 className="h-5 w-5 text-green-600" />
//                                 ผลงานตามคลินิก
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>คลินิก</TableHead>
//                                         <TableHead>สาขา</TableHead>
//                                         <TableHead className="text-right">Leads</TableHead>
//                                         <TableHead className="text-right">มาตามนัด</TableHead>
//                                         <TableHead className="text-right">อัตราการมา</TableHead>
//                                         <TableHead className="text-right">รายได้</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {clinics.map((clinic) => (
//                                         <TableRow key={`${clinic.clinicId}-${clinic.branch}`}>
//                                             <TableCell>
//                                                 <div className="flex items-center gap-2">
//                                                     <Badge variant="outline" className="bg-gray-100">
//                                                         {clinic.clinicId}
//                                                     </Badge>
//                                                     <span className="font-medium">{clinic.clinicName}</span>
//                                                 </div>
//                                             </TableCell>
//                                             <TableCell className="text-gray-600">{clinic.branch}</TableCell>
//                                             <TableCell className="text-right">{formatNumber(clinic.total)}</TableCell>
//                                             <TableCell className="text-right text-green-600">{formatNumber(clinic.arrived)}</TableCell>
//                                             <TableCell className="text-right">
//                                                 <Badge variant="outline" className={clinic.conversionRate >= 50 ? 'text-green-600' : 'text-yellow-600'}>
//                                                     {formatPercent(clinic.conversionRate)}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right font-medium">{formatCurrency(clinic.revenue)}</TableCell>
//                                         </TableRow>
//                                     ))}
//                                     {clinics.length === 0 && (
//                                         <TableRow>
//                                             <TableCell colSpan={6} className="text-center text-gray-500 py-8">
//                                                 ไม่มีข้อมูลคลินิก
//                                             </TableCell>
//                                         </TableRow>
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </CardContent>
//                     </Card>
//                 </>
//             )}
//         </div>
//     );
// }

import { useState, useEffect } from 'react';
import { useLeadsStatsStore } from '@/stores/externalLeadsStore';
import { externalLeadsService } from '@/services/externalLeadsService';
import type { StatsParams, ClinicOption } from '@/types/externalLeads';
import { format, subMonths } from 'date-fns';

// Sub-components
import StatsOverviewCards from '../../components/lead/stats/StatsOverviewCards';
import StatusBreakdownCard from '../../components/lead/stats/StatusBreakdownCard';
import FinanceSummaryCard from '../../components/lead/stats/FinanceSummaryCard';
import InterestsCard from '../../components/lead/stats/InterestsCard';
import TrendsCard from '../../components/lead/stats/TrendsCard';
import ClinicPerformanceCard from '../../components/lead/stats/ClinicPerformanceCard';

// UI
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Filter,
    RefreshCw,
    Loader2,
    AlertCircle,
    X,
    Building2,
} from 'lucide-react';

// ==================== Component ====================

export default function LeadsStats() {
    // Store
    const overview = useLeadsStatsStore((s) => s.overview);
    const finance = useLeadsStatsStore((s) => s.finance);
    const interests = useLeadsStatsStore((s) => s.interests);
    const trends = useLeadsStatsStore((s) => s.trends);
    const clinics = useLeadsStatsStore((s) => s.clinics);
    const isLoading = useLeadsStatsStore((s) => s.isLoading);
    const error = useLeadsStatsStore((s) => s.error);
    const fetchAllStats = useLeadsStatsStore((s) => s.fetchAllStats);
    const clearError = useLeadsStatsStore((s) => s.clearError);

    // Filter State
    const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);
    const [clinicId, setClinicId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(() =>
        format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    );
    const [endDate, setEndDate] = useState<string>(() =>
        format(new Date(), 'yyyy-MM-dd'),
    );
    const [showFilters, setShowFilters] = useState(false);

    // ==================== Load Clinics ====================

    useEffect(() => {
        externalLeadsService.options.getClinics(true).then((res) => {
            if (res.success && res.data) setClinicOptions(res.data);
        });
    }, []);

    // ==================== Helpers ====================

    const buildParams = (): StatsParams => {
        const params: StatsParams = {};
        if (clinicId) params.clinic_id = parseInt(clinicId);
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return params;
    };

    // ==================== Fetch Stats ====================

    useEffect(() => {
        fetchAllStats(buildParams());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => fetchAllStats(buildParams());

    const handleClearFilters = () => {
        setClinicId('');
        setStartDate(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
        fetchAllStats({});
    };

    // ==================== Derived ====================

    const conversionRate = overview
        ? overview.total > 0
            ? Math.round((overview.arrived / overview.total) * 100)
            : 0
        : 0;

    // ==================== Render ====================

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 flex-1">{error}</span>
                    <Button variant="ghost" size="sm" onClick={clearError}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">สถิติ Leads</h1>
                    <p className="text-gray-500 mt-1">ภาพรวมข้อมูลและประสิทธิภาพของระบบ Leads</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="h-4 w-4 mr-2" />
                        ตัวกรอง
                    </Button>
                    <Button onClick={handleRefresh} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        รีเฟรช
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">คลินิก</Label>
                                <Select value={clinicId || '__all__'} onValueChange={(v) => setClinicId(v === '__all__' ? '' : v)}>
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="ทั้งหมด" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-60">
                                        <SelectItem value="__all__">ทั้งหมด</SelectItem>
                                        {clinicOptions.map((clinic) => (
                                            <SelectItem key={clinic.clinicId} value={String(clinic.clinicId)} disabled={clinic.isExpired}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{clinic.clinicName}</span>
                                                    {clinic.isExpired && (
                                                        <Badge variant="outline" className="text-[10px] text-red-400 border-red-200 px-1.5 py-0 ml-1">หมดอายุ</Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">วันเริ่มต้น</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">วันสิ้นสุด</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>
                            <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                                ใช้ตัวกรอง
                            </Button>
                            <Button variant="ghost" onClick={handleClearFilters}>
                                ล้าง
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
                </div>
            )}

            {/* Data Sections */}
            {!isLoading && (
                <>
                    <StatsOverviewCards
                        overview={overview}
                        finance={finance}
                        conversionRate={conversionRate}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <StatusBreakdownCard overview={overview} />
                        <FinanceSummaryCard finance={finance} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <InterestsCard interests={interests} />
                        <TrendsCard trends={trends} />
                    </div>

                    <ClinicPerformanceCard clinics={clinics} />
                </>
            )}
        </div>
    );
}