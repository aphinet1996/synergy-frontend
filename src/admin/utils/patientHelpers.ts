import type { Patient } from '@/types/externalLeads';

// ==================== Formatters ====================

export const formatCurrency = (amount?: number) => {
    if (!amount) return '฿0';
    return `฿${amount.toLocaleString()}`;
};

export const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ==================== Constants ====================

export const TRANSACTION_STYLES = {
    deposit: 'bg-green-100 text-green-700',
    use: 'bg-red-100 text-red-700',
    refund: 'bg-yellow-100 text-yellow-700',
    adjust: 'bg-blue-100 text-blue-700',
} as const;

export const TRANSACTION_LABELS = {
    deposit: 'เพิ่มมัดจำ',
    use: 'ใช้มัดจำ',
    refund: 'คืนเงิน',
    adjust: 'ปรับยอด',
} as const;

export type WalletAction = 'deposit' | 'use' | 'refund' | 'adjust';

// ==================== Patient Form ====================

export interface PatientFormData {
    clinicId: string;
    fullname: string;
    nickname: string;
    tel: string;
    socialMedia: string;
    interest: string;
    referralChannel: string;
    branch: string;
    note: string;
}

export const DEFAULT_FORM: PatientFormData = {
    clinicId: '',
    fullname: '',
    nickname: '',
    tel: '',
    socialMedia: '',
    interest: '',
    referralChannel: '',
    branch: '',
    note: '',
};

export const patientToForm = (patient: Patient, selectedClinicId: string): PatientFormData => {
    const clinicId = patient.clinicId || parseInt(selectedClinicId);
    return {
        clinicId: String(clinicId || selectedClinicId),
        fullname: patient.fullname,
        nickname: patient.nickname || '',
        tel: patient.tel || '',
        socialMedia: patient.socialMedia || '',
        interest: patient.interest || '',
        referralChannel: patient.referralChannel || '',
        branch: patient.branch || '',
        note: patient.note || '',
    };
};