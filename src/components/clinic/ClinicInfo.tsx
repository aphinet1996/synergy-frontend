import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Building2,
    Users,
    Calendar,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Clinic } from '@/types/clinic';

interface ClinicInfoTabProps {
    clinic: Clinic;
}

export function ClinicInfoTab({ clinic }: ClinicInfoTabProps) {
    // Helper functions
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
            'active': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'ใช้งาน' },
            'inactive': { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'ไม่ใช้งาน' },
            'pending': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'รอดำเนินการ' },
            'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'กำลังดำเนินการ' },
            'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'เสร็จสิ้น' },
            'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'ยกเลิก' },
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
            'yearly': 'รายปี',
            'monthly': 'รายเดือน',
            'project': 'โปรเจกต์',
            'revenue-share': 'Revenue Share',
            'fixed-fee': 'Fixed Fee',
            'hybrid': 'Hybrid',
        };
        return labels[type] || type;
    };

    const getClinicLevelBadge = (level: string) => {
        const levelConfig: Record<string, { color: string; label: string; }> = {
            'easy': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Easy' },
            'soso': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'So so' },
            'hellonearth': { color: 'bg-red-100 text-red-700 border-red-200', label: 'Hell on earth' },
        };
        const config = levelConfig[level] || levelConfig['easy'];
        return (
            <Badge variant="outline" className={config.color}>
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ข้อมูลคลินิก */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        ข้อมูลคลินิก
                    </CardTitle>
                    {getStatusBadge(clinic.status)}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">ชื่อคลินิก (ไทย)</label>
                            <p className="text-base mt-1 font-medium text-gray-900">{clinic.name.th}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">ชื่อคลินิก (English)</label>
                            <p className="text-base mt-1 font-medium text-gray-900">{clinic.name.en}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            ข้อมูลสัญญา
                        </h4>
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
                                    <div className="mt-1">
                                        {getClinicLevelBadge(clinic.clinicLevel)}
                                    </div>
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
                        </div>
                    </div>

                    {clinic.note && (
                        <div className="pt-4 border-t">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                หมายเหตุ
                            </label>
                            <p className="text-base mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{clinic.note}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ทีมผู้รับผิดชอบ */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        ทีมผู้รับผิดชอบ
                        {clinic.assignedTo && clinic.assignedTo.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {clinic.assignedTo.length} คน
                            </Badge>
                        )}
                    </CardTitle>
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
                                        <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {user.name || 'ไม่ระบุชื่อ'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {user.position && (
                                                <span className="text-sm text-gray-500">{user.position}</span>
                                            )}
                                            {user.role && (
                                                <Badge variant="outline" className="text-xs">
                                                    {user.role}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>ยังไม่มีผู้รับผิดชอบ</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ขอบเขตงาน (Services) */}
            {clinic.service && (
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            ขอบเขตงาน
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Setup */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">Setup</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        {clinic.service.setup?.requirement ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-300" />
                                        )}
                                        <span>รวบรวม Requirement</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {clinic.service.setup?.socialMedia ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-300" />
                                        )}
                                        <span>Setup Social Media</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {clinic.service.setup?.adsManager ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-300" />
                                        )}
                                        <span>Setup Ads Manager</span>
                                    </div>
                                </div>
                            </div>

                            {/* CI & Website */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">CI & Website</h4>
                                <div className="space-y-1 text-sm">
                                    {clinic.service.coperateIdentity?.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="font-medium">{item.amount}</span>
                                        </div>
                                    ))}
                                    {clinic.service.website?.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="font-medium">{item.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">Social Media</h4>
                                <div className="space-y-1 text-sm">
                                    {clinic.service.socialMedia?.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="font-medium">{item.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Training */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">Training</h4>
                                <div className="space-y-1 text-sm">
                                    {clinic.service.training?.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="font-medium">{item.amount} ครั้ง</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}