import type { LeadAppointment } from '@/types/externalLeads';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

// ==================== Formatters ====================

export const formatDate = (date: string | undefined | null) => {
    if (!date) return '-';
    try {
        return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: th });
    } catch {
        return '-';
    }
};

export const formatShortDate = (date: string | undefined | null) => {
    if (!date) return '-';
    try {
        return format(new Date(date), 'dd MMM yyyy', { locale: th });
    } catch {
        return '-';
    }
};

export const formatCurrency = (amount: any) => {
    if (amount === undefined || amount === null) return '-';
    const num = typeof amount === 'object' ? (amount?.amount ?? 0) : Number(amount);
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(num);
};

/**
 * Resolve file URL from Lead API server
 * receiptUrl is stored as relative path like "/uploads/slips/slip-xxx.png"
 * Need to prefix with Lead API server base URL
 */
export const resolveFileUrl = (path: string | undefined | null): string | null => {
    if (!path) return null;
    // Already a full URL
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Relative path — prefix with Lead server base
    const baseUrl = import.meta.env.VITE_LEADS_SERVER_URL || '';
    return baseUrl ? `${baseUrl}${path}` : path;
};

// ==================== Month / Year ====================

export const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/** Get start/end dates for a month (1-indexed) */
export const getMonthRange = (year: number, month: number) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
    };
};

/** Get current year + month */
export const getCurrentYearMonth = () => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

/** Generate year options (current year ± 2) */
export const getYearOptions = () => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 2 + i).reverse();
};

// ==================== Status Config ====================

export const STATUS_CONFIG: Record<string, { color: string; label: string; dotColor: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'รอดำเนินการ', dotColor: 'bg-yellow-400' },
    scheduled: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'นัดแล้ว', dotColor: 'bg-blue-500' },
    rescheduled: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'เลื่อนนัด', dotColor: 'bg-purple-500' },
    arrived: { color: 'bg-green-100 text-green-700 border-green-200', label: 'มาแล้ว', dotColor: 'bg-green-500' },
    cancelled: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'ยกเลิก', dotColor: 'bg-gray-400' },
};

// ==================== Form Types ====================

export interface LeadFormData {
    clinicId: string;
    fullname: string;
    tel: string;
    nickname: string;
    socialMedia: string;
    status: LeadAppointment['status'];
    appointmentDate: string;
    appointmentTime: string;
    interestIds: string[];
    channelId: string;
    adminId: string;
    note: string;
    deposit: string;
}

export const DEFAULT_LEAD_FORM: LeadFormData = {
    clinicId: '',
    fullname: '',
    tel: '',
    nickname: '',
    socialMedia: '',
    status: 'pending',
    appointmentDate: '',
    appointmentTime: '',
    interestIds: [],
    channelId: '',
    adminId: '',
    note: '',
    deposit: '',
};