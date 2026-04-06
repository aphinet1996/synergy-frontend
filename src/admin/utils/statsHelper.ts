// ==================== Formatters ====================

export const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '฿0';
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
};

export const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('th-TH').format(num);
};

export const formatPercent = (num: number | undefined) => {
    if (num === undefined || num === null) return '0%';
    return `${num}%`;
};

// ==================== Status Config ====================

export interface StatusItem {
    key: string;
    label: string;
    colorClass: string;       // icon color
}

export const STATUS_ITEMS: StatusItem[] = [
    { key: 'pending', label: 'รอดำเนินการ', colorClass: 'text-yellow-500' },
    { key: 'scheduled', label: 'นัดแล้ว', colorClass: 'text-blue-500' },
    { key: 'rescheduled', label: 'เลื่อนนัด', colorClass: 'text-purple-500' },
    { key: 'arrived', label: 'มาแล้ว', colorClass: 'text-green-500' },
    { key: 'cancelled', label: 'ยกเลิก', colorClass: 'text-gray-400' },
];