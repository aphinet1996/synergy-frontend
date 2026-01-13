import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GanttTimeline } from '@/components/clinic/GanttTimeline';
import { ClinicDialog } from '@/components/clinic/ClinicDialog';
import { BoardTab } from '@/components/clinic/BoardTab';
import { DocumentTab } from '@/components/clinic/DocumentTab';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Briefcase,
    Presentation,
    RefreshCw,
    FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import { useClinicStore } from '@/stores/clinicStore';
import { clinicService } from '@/services/clinicService';
import type { Clinic, TimelineItem } from '@/types/clinic';

export default function ClinicDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('board');
    const [isEditClinicOpen, setIsEditClinicOpen] = useState(false);

    const { getClinicById, loading: clinicLoading, error: clinicError } = useClinicStore();
    const [clinic, setClinic] = useState<Clinic | null>(null);

    // Timeline state
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [timelineError, setTimelineError] = useState<string | null>(null);
    const [contractDates, setContractDates] = useState<{ start: Date; end: Date } | null>(null);

    // Fetch clinic data
    useEffect(() => {
        if (id) {
            getClinicById(id).then((data) => {
                if (data) {
                    setClinic(data);
                }
            });
        }
    }, [id, getClinicById]);

    // Timeline fetch
    const fetchTimeline = useCallback(async () => {
        if (!id) return;

        setTimelineLoading(true);
        setTimelineError(null);

        const response = await clinicService.getTimeline(id);

        if (response.success && response.data) {
            setTimeline(response.data.timeline);
            setContractDates({
                start: response.data.contractDateStart,
                end: response.data.contractDateEnd,
            });
        } else {
            setTimelineError(response.error || 'Failed to fetch timeline');
        }

        setTimelineLoading(false);
    }, [id]);

    useEffect(() => {
        if (activeTab === 'timeline') {
            fetchTimeline();
        }
    }, [activeTab, fetchTimeline]);

    // Timeline handlers
    const handleUpdateTimelineItem = async (
        itemId: string,
        updates: { weekStart?: number; weekEnd?: number; serviceName?: string }
    ): Promise<void> => {
        if (!id) return;

        const response = await clinicService.updateTimelineItem(id, itemId, updates);

        if (response.success && response.data) {
            setTimeline(response.data.timeline);
        } else {
            setTimelineError(response.error || 'Failed to update timeline item');
        }
    };

    const handleDeleteTimelineItem = async (itemId: string): Promise<void> => {
        if (!id) return;

        const response = await clinicService.deleteTimelineItem(id, itemId);

        if (response.success && response.data) {
            setTimeline(response.data.timeline);
        } else {
            setTimelineError(response.error || 'Failed to delete timeline item');
        }
    };

    // Clinic handlers
    const handleEditClinicSuccess = async () => {
        if (id) {
            const data = await getClinicById(id);
            if (data) {
                setClinic(data);
            }
        }
        setIsEditClinicOpen(false);
    };

    const handleDeleteClinic = async () => {
        if (!id || !confirm('คุณต้องการลบคลินิกนี้ใช่หรือไม่?')) return;

        const response = await clinicService.deleteClinic(id);
        if (response.success) {
            navigate('/clinics');
        }
    };

    // Helper functions
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
            'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'กำลังดำเนินการ' },
            'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'เสร็จสิ้น' },
            'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'ยกเลิก' },
            'pending': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'รอดำเนินการ' },
        };
        const config = statusConfig[status] || statusConfig['pending'];
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} gap-1`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getContractTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'revenue-share': 'Revenue Share',
            'fixed-fee': 'Fixed Fee',
            'hybrid': 'Hybrid',
        };
        return labels[type] || type;
    };

    // Loading state
    if (clinicLoading) {
        return (
            <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    // Error state
    if (clinicError || !clinic) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {clinicError || 'ไม่พบข้อมูลคลินิก'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-screen">
                {/* Fixed Header */}
                <div className="sticky top-0 bg-white border-b z-10 shadow-sm">
                    {/* Header Row */}
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => navigate('/clinics')}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{clinic.name.th}</h1>
                                    <p className="text-sm text-gray-500">{clinic.name.en}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={() => setIsEditClinicOpen(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    แก้ไข
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteClinic}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    ลบ
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Row */}
                    <div className="px-6 pb-2">
                        <TabsList className="bg-gray-100/80">
                            <TabsTrigger
                                value="board"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <Presentation className="h-4 w-4" />
                                <span className="hidden sm:inline">Boards</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="timeline"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <Clock className="h-4 w-4" />
                                <span className="hidden sm:inline">Timeline</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="document"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Documents</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="info"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <Briefcase className="h-4 w-4" />
                                <span className="hidden sm:inline">Clinic Info</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* ==================== TAB: BOARD ==================== */}
                    <TabsContent value="board" className="mt-0 p-4">
                        <BoardTab clinicId={id!} />
                    </TabsContent>

                    {/* ==================== TAB: TIMELINE ==================== */}
                    <TabsContent value="timeline" className="mt-0 p-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                    Timeline
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchTimeline}
                                    disabled={timelineLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${timelineLoading ? 'animate-spin' : ''}`} />
                                    รีเฟรช
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {timelineError && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{timelineError}</AlertDescription>
                                    </Alert>
                                )}

                                {contractDates ? (
                                    <GanttTimeline
                                        clinicId={id!}
                                        startDate={contractDates.start}
                                        endDate={contractDates.end}
                                        items={timeline}
                                        loading={timelineLoading}
                                        onUpdateItem={handleUpdateTimelineItem}
                                        onDeleteItem={handleDeleteTimelineItem}
                                        onRefresh={fetchTimeline}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center py-12 text-gray-500">
                                        {timelineLoading ? 'กำลังโหลด Timeline...' : 'ไม่พบข้อมูล Timeline'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================== TAB: DOCUMENT ==================== */}
                    <TabsContent value="document" className="mt-0 p-4">
                        <Card>
                            <CardContent className="pt-6">
                                <DocumentTab clinicId={id!} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================== TAB: CLINIC INFO ==================== */}
                    <TabsContent value="info" className="mt-0 p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* ข้อมูลคลินิก และข้อมูลสัญญา */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <CardTitle>ข้อมูลคลินิก</CardTitle>
                                    {getStatusBadge(clinic.status)}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">ชื่อคลินิก (ไทย)</label>
                                        <p className="text-base mt-1 font-medium text-gray-900">{clinic.name.th}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">ชื่อคลินิก (English)</label>
                                        <p className="text-base mt-1 font-medium text-gray-900">{clinic.name.en}</p>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4">ข้อมูลสัญญา</h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">ประเภทสัญญา</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">
                                                        {getContractTypeLabel(clinic.contractType)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">ระดับคลินิก</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">
                                                        {clinic.clinicLevel?.charAt(0).toUpperCase() + clinic.clinicLevel?.slice(1) || 'ไม่ระบุ'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">วันที่เริ่มสัญญา</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">
                                                        {clinic.contractDateStart
                                                            ? format(new Date(clinic.contractDateStart), 'dd MMM yyyy', { locale: th })
                                                            : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">วันที่สิ้นสุดสัญญา</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">
                                                        {clinic.contractDateEnd
                                                            ? format(new Date(clinic.contractDateEnd), 'dd MMM yyyy', { locale: th })
                                                            : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            {clinic.note && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">หมายเหตุ</label>
                                                    <p className="text-base mt-1 text-gray-700">{clinic.note}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ทีมผู้รับผิดชอบ */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>ทีมผู้รับผิดชอบ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {clinic.assignedTo && clinic.assignedTo.length > 0 ? (
                                            clinic.assignedTo.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarFallback className="bg-purple-100 text-purple-700">
                                                            {user.name?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">{user.name || 'ไม่ระบุชื่อ'}</p>
                                                        {user.role && (
                                                            <p className="text-xs text-gray-400 mt-1">{user.role}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                ยังไม่มีผู้รับผิดชอบ
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Edit Clinic Dialog */}
            {clinic && (
                <ClinicDialog
                    open={isEditClinicOpen}
                    onOpenChange={setIsEditClinicOpen}
                    onSuccess={handleEditClinicSuccess}
                    mode="edit"
                    initialData={clinic}
                />
            )}
        </div>
    );
}