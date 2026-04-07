// import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    Building2,
    Clock,
    Shield,
    AlertCircle,
    CheckCircle2,
    XCircle,
    FileText,
    CalendarDays,
    UserCircle,
    IdCard,
    MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function Profile() {
    const { user, loading, error, refetch } = useUser();
    // const [isEditing, setIsEditing] = useState(false);

    // Helper functions
    const getRoleBadge = (role: string) => {
        const roleConfig: Record<string, { color: string; label: string }> = {
            admin: { color: 'bg-red-100 text-red-700 border-red-200', label: 'ผู้ดูแลระบบ' },
            manager: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'ผู้จัดการ' },
            employee: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'พนักงาน' },
        };
        const config = roleConfig[role] || roleConfig['employee'];
        return (
            <Badge variant="outline" className={config.color}>
                <Shield className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                ใช้งาน
            </Badge>
        ) : (
            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                <XCircle className="h-3 w-3 mr-1" />
                ไม่ใช้งาน
            </Badge>
        );
    };

    const formatDate = (date: Date | string | undefined | null) => {
        if (!date) return '-';
        try {
            return format(new Date(date), 'dd MMMM yyyy', { locale: th });
        } catch {
            return '-';
        }
    };

    const getInitials = (firstname: string, lastname: string) => {
        return `${firstname?.charAt(0) || ''}${lastname?.charAt(0) || ''}`.toUpperCase() || 'U';
    };

    const getEmployeeTypeLabel = (type: string | undefined) => {
        const types: Record<string, string> = {
            permanent: 'พนักงานประจำ',
            probation: 'ทดลองงาน',
            freelance: 'ฟรีแลนซ์',
        };
        return types[type || ''] || type || '-';
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6 pb-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    // Error state
    if (error || !user) {
        return (
            <div className="space-y-6 pb-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'ไม่พบข้อมูลผู้ใช้'}
                        <Button
                            variant="link"
                            className="ml-2 p-0 h-auto"
                            onClick={() => refetch()}
                        >
                            ลองอีกครั้ง
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Get position display name from position object
    const positionName = user.position?.name || 'ไม่ระบุตำแหน่ง';

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์</h1>
                    <p className="text-gray-500 mt-1">ข้อมูลส่วนตัวและการทำงาน</p>
                </div>
            </div>

            {/* Profile Header Card */}
            <Card>
                <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-24 w-24 border-2 border-purple-100 shadow-md">
                            <AvatarImage src={user.profile || undefined} alt={user.firstname} />
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-bold">
                                {getInitials(user.firstname, user.lastname)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Name & Status */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {user.firstname} {user.lastname}
                                </h2>
                                {getRoleBadge(user.role)}
                                {getStatusBadge(user.isActive)}
                            </div>
                            <p className="text-gray-500 mt-1">
                                {positionName} • @{user.username}
                            </p>
                            {user.nickname && (
                                <p className="text-sm text-gray-400 mt-0.5">
                                    ชื่อเล่น: {user.nickname}
                                </p>
                            )}
                        </div>

                        {/* Last Login */}
                        <div className="text-sm text-gray-500 sm:text-right">
                            <p className="flex items-center gap-1 sm:justify-end">
                                <Clock className="h-4 w-4" />
                                เข้าสู่ระบบล่าสุด
                            </p>
                            <p className="font-medium text-gray-700">
                                {formatDate(user.lastLogin)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserCircle className="h-5 w-5 text-purple-600" />
                            ข้อมูลส่วนตัว
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow
                            icon={<User className="h-4 w-4" />}
                            label="ชื่อ-นามสกุล"
                            value={`${user.firstname} ${user.lastname}`}
                        />
                        <InfoRow
                            icon={<IdCard className="h-4 w-4" />}
                            label="ชื่อเล่น"
                            value={user.nickname || '-'}
                        />
                        <InfoRow
                            icon={<Phone className="h-4 w-4" />}
                            label="เบอร์โทรศัพท์"
                            value={user.tel || '-'}
                        />
                        <InfoRow
                            icon={<MessageCircle className="h-4 w-4" />}
                            label="Line User ID"
                            value={user.lineUserId || '-'}
                        />
                        <InfoRow
                            icon={<Calendar className="h-4 w-4" />}
                            label="วันเกิด"
                            value={formatDate(user.birthDate)}
                        />
                        <InfoRow
                            icon={<MapPin className="h-4 w-4" />}
                            label="ที่อยู่"
                            value={user.address || '-'}
                            multiline
                        />
                    </CardContent>
                </Card>

                {/* Work Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                            ข้อมูลการทำงาน
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow
                            icon={<Building2 className="h-4 w-4" />}
                            label="ตำแหน่ง"
                            value={positionName}
                        />
                        <InfoRow
                            icon={<Shield className="h-4 w-4" />}
                            label="สิทธิ์การใช้งาน"
                            value={
                                user.role === 'admin' ? 'ผู้ดูแลระบบ' :
                                    user.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'
                            }
                        />
                        <InfoRow
                            icon={<FileText className="h-4 w-4" />}
                            label="ประเภทพนักงาน"
                            value={getEmployeeTypeLabel(user.employeeType)}
                        />
                        <InfoRow
                            icon={<CalendarDays className="h-4 w-4" />}
                            label="วันที่เริ่มงาน"
                            value={formatDate(user.employeeDateStart)}
                        />

                        <Separator className="my-4" />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                ข้อมูลสัญญา
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">ประเภทสัญญา</span>
                                    <span className="text-sm font-medium text-gray-900">{user.contract || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">วันที่เริ่มสัญญา</span>
                                    <span className="text-sm font-medium text-gray-900">{formatDate(user.contractDateStart)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">วันที่สิ้นสุดสัญญา</span>
                                    <span className="text-sm font-medium text-gray-900">{formatDate(user.contractDateEnd)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Account Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-purple-600" />
                        ข้อมูลบัญชี
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">ชื่อผู้ใช้</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">@{user.username}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">สถานะบัญชี</p>
                            <div className="mt-1">
                                {getStatusBadge(user.isActive)}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">วันที่สร้าง</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                {formatDate(user.createdAt)}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">แก้ไขล่าสุด</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                {formatDate(user.updatedAt)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Info Row Component
interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    multiline?: boolean;
}

function InfoRow({ icon, label, value, multiline }: InfoRowProps) {
    return (
        <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-center justify-between'}`}>
            <div className="flex items-center gap-2 text-gray-500">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <p className={`font-medium text-gray-900 ${multiline ? 'mt-1 text-sm bg-gray-50 p-2 rounded-lg' : 'text-right'}`}>
                {value}
            </p>
        </div>
    );
}