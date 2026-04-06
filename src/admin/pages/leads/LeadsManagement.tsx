import { useState, useEffect, useRef, useCallback } from 'react';
import { useLeadsStore } from '@/stores/externalLeadsStore';
import { optionsApi } from '@/services/externalLeadsService';
import { useUser } from '@/hooks/useUser';
import type { Lead, LeadListParams, ClinicOption } from '@/types/externalLeads';
import {
    THAI_MONTHS,
    THAI_MONTHS_SHORT,
    getMonthRange,
    getCurrentYearMonth,
    getYearOptions,
} from '../../utils/leadHelpers';

// Sub-components
import LeadRow from '../../components/lead/lists/LeadRow';
import LeadFormDialog from '../../components/lead/lists/LeadFormDialog';
import LeadDetailDialog from '../../components/lead/lists/LeadDetailDialog';
import LeadDeleteDialog from '../../components/lead/lists/LeadDeleteDialog';
// import LeadHistoryDialog from '../../components/lead/lists/LeadHistoryDialog';

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
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Building2,
} from 'lucide-react';

// ==================== Component ====================

export default function LeadsManagement() {
    const { user: currentUser } = useUser();
    const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    // Store
    const leads = useLeadsStore((s) => s.leads);
    const pagination = useLeadsStore((s) => s.pagination);
    const isLoading = useLeadsStore((s) => s.isLoading);
    const error = useLeadsStore((s) => s.error);
    const fetchLeads = useLeadsStore((s) => s.fetchLeads);
    const fetchLeadById = useLeadsStore((s) => s.fetchLeadById);
    // const fetchLeadHistory = useLeadsStore((s) => s.fetchLeadHistory);
    const clearError = useLeadsStore((s) => s.clearError);

    // Options
    const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);

    // Filters
    const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState<string>(String(currentYear));
    const [filterMonth, setFilterMonth] = useState<string>(String(currentMonth));
    const [filterClinicId, setFilterClinicId] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Dialogs
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [formLead, setFormLead] = useState<Lead | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLead, setDetailLead] = useState<Lead | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
    // const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    // const [historyLead, setHistoryLead] = useState<Lead | null>(null);

    // Refs
    const isInitialMount = useRef(true);
    const isFirstSearch = useRef(true);

    const totalPages = pagination?.totalPages || 1;
    const yearOptions = getYearOptions();

    // ==================== Load Clinics ====================

    useEffect(() => {
        optionsApi.getClinics(true).then((res) => {
            if (res.success && res.data) setClinicOptions(res.data);
        });
    }, []);

    // ==================== Build Params ====================

    const buildParams = useCallback((): LeadListParams => {
        const { start_date, end_date } = getMonthRange(parseInt(filterYear), parseInt(filterMonth));
        const params: LeadListParams = {
            page: currentPage,
            limit: 20,
            start_date,
            end_date,
        };
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (filterClinicId) params.clinic_id = parseInt(filterClinicId);
        if (filterStatus !== 'all') params.status = filterStatus;
        return params;
    }, [currentPage, searchQuery, filterYear, filterMonth, filterClinicId, filterStatus]);

    // ==================== Fetch Leads ====================

    useEffect(() => {
        fetchLeads(buildParams());
    }, [buildParams]);

    // Reset page on filter change
    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        setCurrentPage(1);
    }, [searchQuery, filterYear, filterMonth, filterClinicId, filterStatus]);

    // Debounced search
    useEffect(() => {
        if (isFirstSearch.current) { isFirstSearch.current = false; return; }
        const timer = setTimeout(() => setSearchQuery(searchInput), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const reloadLeads = useCallback(() => {
        fetchLeads(buildParams());
    }, [buildParams, fetchLeads]);

    // ==================== Dialog Handlers ====================

    const openCreate = () => {
        setFormLead(null);
        setFormDialogOpen(true);
    };

    const openEdit = useCallback(async (lead: Lead) => {
        setFormLead(lead);
        setFormDialogOpen(true);
    }, []);

    const openDetail = useCallback(async (lead: Lead) => {
        const detail = await fetchLeadById(lead._id);
        if (detail) {
            setDetailLead(detail);
            setDetailDialogOpen(true);
        }
    }, [fetchLeadById]);

    const openDelete = useCallback((lead: Lead) => {
        setDeletingLead(lead);
        setDeleteDialogOpen(true);
    }, []);

    // const openHistory = useCallback(async (lead: Lead) => {
    //     await fetchLeadHistory(lead._id, lead.clinic.clinicId);
    //     setHistoryLead(lead);
    //     setHistoryDialogOpen(true);
    // }, [fetchLeadHistory]);

    // ==================== Month Label ====================

    const monthLabel = `${THAI_MONTHS[parseInt(filterMonth) - 1]} ${parseInt(filterYear) + 543}`;

    // ==================== Loading ====================

    if (isLoading && leads.length === 0 && !pagination) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล Leads...</span>
            </div>
        );
    }

    // ==================== Render ====================

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 flex-1">{error}</span>
                    <Button variant="ghost" size="sm" onClick={clearError}><X className="h-4 w-4" /></Button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">รายการ Leads</h1>
                    <p className="text-gray-500 mt-1">
                        ข้อมูล Leads ประจำ{monthLabel}
                    </p>
                </div>
                {canManage && (
                    <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 w-fit">
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่ม Lead
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="mt-4 flex-shrink-0">
                <div className="bg-white rounded-xl border p-4">
                    <div className="grid grid-cols-12 gap-2">
                        {/* เดือน */}
                        <div className="col-span-2">
                            <Label className="text-sm text-gray-600 mb-1.5 block">เดือน</Label>
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="max-h-52 overflow-y-auto">
                                    {THAI_MONTHS.map((m, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ปี */}
                        <div className="col-span-1">
                            <Label className="text-sm text-gray-600 mb-1.5 block">ปี</Label>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                    {yearOptions.map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y + 543}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* คลินิก */}
                        <div className="col-span-3">
                            <Label className="text-sm text-gray-600 mb-1.5 block">คลินิก</Label>
                            <Select value={filterClinicId || 'all'} onValueChange={(v) => setFilterClinicId(v === 'all' ? '' : v)}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="ทุกคลินิก" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-60">
                                    <SelectItem value="all">ทุกคลินิก</SelectItem>
                                    {clinicOptions.map((clinic) => (
                                        <SelectItem key={clinic.clinicId} value={String(clinic.clinicId)} disabled={clinic.isExpired}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                {clinic.label}
                                                {clinic.isExpired && <Badge variant="outline" className="text-red-500 text-xs">หมดอายุ</Badge>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* สถานะ */}
                        <div className="col-span-2">
                            <Label className="text-sm text-gray-600 mb-1.5 block">สถานะ</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                                    <SelectItem value="scheduled">นัดแล้ว</SelectItem>
                                    <SelectItem value="rescheduled">เลื่อนนัด</SelectItem>
                                    <SelectItem value="arrived">มาแล้ว</SelectItem>
                                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ค้นหา */}
                        <div className="col-span-4">
                            <Label className="text-sm text-gray-600 mb-1.5 block">ค้นหา</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ค้นหาชื่อ, เบอร์โทร, ชื่อเล่น..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-9 h-10"
                                />
                                {searchInput && (
                                    <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchInput('')}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 mt-4 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5 text-blue-600" />
                            รายการ Leads — {monthLabel}
                            {pagination && <span className="text-sm font-normal text-gray-500">({pagination.total} รายการ)</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>ผู้ป่วย</TableHead>
                                    <TableHead>คลินิก</TableHead>
                                    <TableHead className="text-center">สถานะ</TableHead>
                                    <TableHead>วันนัด</TableHead>
                                    <TableHead className="text-right">ยอดชำระ</TableHead>
                                    <TableHead className="text-right">คอมมิชชัน</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead, index) => (
                                    <LeadRow
                                        key={lead._id}
                                        lead={lead}
                                        index={(currentPage - 1) * 20 + index + 1}
                                        canManage={canManage}
                                        onDetail={openDetail}
                                        // onHistory={openHistory}
                                        onEdit={openEdit}
                                        onDelete={openDelete}
                                    />
                                ))}
                                {leads.length === 0 && !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16">
                                            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium text-gray-900">ไม่พบ Leads</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                ไม่มีข้อมูล Leads ในเดือน{THAI_MONTHS_SHORT[parseInt(filterMonth) - 1]} {parseInt(filterYear) + 543}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0">
                            <p className="text-sm text-gray-500">
                                แสดง {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, pagination.total)} จาก {pagination.total} รายการ
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ==================== Dialogs ==================== */}

            <LeadFormDialog
                open={formDialogOpen}
                lead={formLead}
                clinics={clinicOptions}
                onClose={() => { setFormDialogOpen(false); setFormLead(null); }}
                onSuccess={reloadLeads}
            />

            <LeadDetailDialog
                open={detailDialogOpen}
                lead={detailLead}
                canManage={canManage}
                onClose={() => { setDetailDialogOpen(false); setDetailLead(null); }}
                onEdit={openEdit}
            />

            <LeadDeleteDialog
                open={deleteDialogOpen}
                lead={deletingLead}
                onClose={() => { setDeleteDialogOpen(false); setDeletingLead(null); }}
                onSuccess={reloadLeads}
            />

            {/* <LeadHistoryDialog
                open={historyDialogOpen}
                lead={historyLead}
                onClose={() => { setHistoryDialogOpen(false); setHistoryLead(null); }}
            /> */}
        </div>
    );
}