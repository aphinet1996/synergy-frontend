import { useState, useEffect, useRef, useCallback } from 'react';
import { usePatientsStore } from '@/stores/externalLeadsStore';
import { externalLeadsService } from '@/services/externalLeadsService';
import type { Patient, ClinicOption } from '@/types/externalLeads';
import type { WalletAction } from '../../utils/patientHelpers';
import { useAuthStore } from '@/stores/authStore';

// Sub-components
import PatientRow from '../../components/lead/patients/PatientRow';
import PatientFormDialog from '../../components/lead/patients/PatientFormDialog';
import PatientDetailDialog from '../../components/lead/patients/PatientDetailDialog';
import WalletDialog from '../../components/lead/patients/WalletDialog';

// UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    Plus,
    Search,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Building2,
} from 'lucide-react';

// ==================== Component ====================

export default function PatientsManagement() {
    // Auth
    const user = useAuthStore((s) => s.user);
    const canManage = user?.role === 'admin' || user?.role === 'manager';

    // Store
    const patients = usePatientsStore((s) => s.patients);
    const pagination = usePatientsStore((s) => s.pagination);
    const isLoading = usePatientsStore((s) => s.isLoading);
    const error = usePatientsStore((s) => s.error);
    const fetchPatients = usePatientsStore((s) => s.fetchPatients);
    const clearError = usePatientsStore((s) => s.clearError);

    // Clinic options
    const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);

    // Filters
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 20;

    // Dialog state
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [formPatient, setFormPatient] = useState<Patient | null>(null); // null=create, Patient=edit
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
    const [walletDialogOpen, setWalletDialogOpen] = useState(false);
    const [walletPatient, setWalletPatient] = useState<Patient | null>(null);
    const [walletAction, setWalletAction] = useState<WalletAction>('deposit');

    // Refs
    const skipMount = useRef(true);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ==================== Load Clinics ====================

    useEffect(() => {
        externalLeadsService.options.getClinics(true).then((res) => {
            if (res.success && res.data) {
                setClinicOptions(res.data);
                const first = res.data.find((c) => !c.isExpired);
                if (first) setSelectedClinicId(String(first.clinicId));
            }
        });
    }, []);

    // ==================== Load Patients ====================

    const loadPatients = useCallback(() => {
        if (!selectedClinicId) return;
        fetchPatients({
            clinic_id: parseInt(selectedClinicId),
            page: currentPage,
            limit,
            search: searchQuery || undefined,
        });
    }, [selectedClinicId, currentPage, searchQuery, fetchPatients]);

    useEffect(() => {
        if (skipMount.current) { skipMount.current = false; return; }
        loadPatients();
    }, [loadPatients]);

    useEffect(() => {
        if (selectedClinicId) { setCurrentPage(1); loadPatients(); }
    }, [selectedClinicId]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => setCurrentPage(1), 400);
    };

    // ==================== Dialog Handlers (stable callbacks for memo) ====================

    const openCreate = () => {
        setFormPatient(null);
        setFormDialogOpen(true);
    };

    const openEdit = useCallback((patient: Patient) => {
        setFormPatient(patient);
        setFormDialogOpen(true);
    }, []);

    const openDetail = useCallback((patient: Patient) => {
        setDetailPatient(patient);
        setDetailDialogOpen(true);
    }, []);

    const openWallet = useCallback((patient: Patient, action: WalletAction) => {
        setWalletPatient(patient);
        setWalletAction(action);
        setWalletDialogOpen(true);
    }, []);

    // ==================== Render ====================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-7 w-7 text-purple-600" />
                        จัดการคนไข้
                    </h1>
                    <p className="text-gray-500 mt-1">จัดการข้อมูลคนไข้และเงินมัดจำ</p>
                </div>
                {canManage && (
                    <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700" disabled={!selectedClinicId}>
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มคนไข้
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button variant="ghost" size="sm" onClick={clearError}><X className="h-4 w-4" /></Button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border p-4">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                        <Label className="text-sm text-gray-600 mb-1.5 block">คลินิก</Label>
                        <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                            <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="เลือกคลินิก" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-60">
                                {clinicOptions.map((clinic) => (
                                    <SelectItem key={clinic.clinicId} value={String(clinic.clinicId)} disabled={clinic.isExpired}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            {clinic.clinicName}
                                            {clinic.isExpired && <Badge variant="outline" className="text-red-500 text-xs">หมดอายุ</Badge>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-7">
                        <Label className="text-sm text-gray-600 mb-1.5 block">ค้นหา</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="ค้นหาชื่อ, เบอร์โทร..."
                                className="pl-9 h-10"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost" size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 mt-0 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5 text-purple-600" />
                            รายชื่อคนไข้
                            {pagination && <span className="text-sm font-normal text-gray-500">({pagination.total} รายการ)</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ชื่อ-นามสกุล</TableHead>
                                    <TableHead>เบอร์โทร</TableHead>
                                    <TableHead>สาขา</TableHead>
                                    <TableHead className="text-right">ยอดเงิน</TableHead>
                                    <TableHead className="text-center">วันที่สร้าง</TableHead>
                                    <TableHead className="text-center w-[100px]">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                                            <p className="text-gray-500 mt-2">กำลังโหลด...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : !selectedClinicId ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            กรุณาเลือกคลินิกเพื่อดูรายการคนไข้
                                        </TableCell>
                                    </TableRow>
                                ) : patients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            ไม่พบข้อมูลคนไข้
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    patients.map((patient) => (
                                        <PatientRow
                                            key={patient._id}
                                            patient={patient}
                                            canManage={canManage}
                                            onDetail={openDetail}
                                            onEdit={openEdit}
                                            onWallet={openWallet}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0">
                            <p className="text-sm text-gray-500">
                                แสดง {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.total)} จาก{' '}
                                {pagination.total} รายการ
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage <= 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600">{currentPage} / {pagination.totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= pagination.totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ==================== Dialogs ==================== */}

            <PatientFormDialog
                open={formDialogOpen}
                patient={formPatient}
                selectedClinicId={selectedClinicId}
                clinics={clinicOptions}
                onClose={() => { setFormDialogOpen(false); setFormPatient(null); }}
                onSuccess={loadPatients}
            />

            <PatientDetailDialog
                open={detailDialogOpen}
                patient={detailPatient}
                selectedClinicId={selectedClinicId}
                canManage={canManage}
                onClose={() => { setDetailDialogOpen(false); setDetailPatient(null); }}
                onEdit={openEdit}
            />

            <WalletDialog
                open={walletDialogOpen}
                patient={walletPatient}
                action={walletAction}
                selectedClinicId={selectedClinicId}
                onClose={() => { setWalletDialogOpen(false); setWalletPatient(null); }}
                onSuccess={loadPatients}
            />
        </div>
    );
}