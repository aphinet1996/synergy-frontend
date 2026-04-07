export type LeaveTypeCode = 'annual' | 'sick' | 'personal' | 'maternity' | 'ordination' | 'military' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveDurationType = 'full_day' | 'half_day' | 'hours';
export type HalfDayPeriod = 'morning' | 'afternoon';

export interface LeaveType {
    id: string;
    code: LeaveTypeCode;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    defaultDays: number;
    maxDaysPerRequest?: number;
    requireApproval: boolean;
    allowHalfDay: boolean;
    allowHours: boolean;
    allowPastDate: boolean;
    pastDateLimit?: number;
    requireAttachment: boolean;
    isActive: boolean;
}

export interface LeaveBalance {
    leaveType: {
        id: string;
        code: LeaveTypeCode;
        name: string;
        color: string;
        icon?: string;
    };
    total: number;
    used: number;
    pending: number;
    remaining: number;
    carryOver: number;
}

export interface LeaveBalanceResponse {
    year: number;
    balances: LeaveBalance[];
    summary: {
        totalDays: number;
        usedDays: number;
        pendingDays: number;
        remainingDays: number;
    };
}

export interface LeaveRequest {
    id: string;
    requestNumber: string;
    user: string;
    userName: string;
    userPosition?: string;
    leaveType: string;
    leaveTypeCode: LeaveTypeCode;
    leaveTypeName: string;
    durationType: LeaveDurationType;
    halfDayPeriod?: HalfDayPeriod;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    days: number;
    hours?: number;
    reason: string;
    attachments: string[];
    status: LeaveStatus;
    currentApprovalStep: number;
    approvalHistory: ApprovalHistoryItem[];
    approvedAt?: string;
    rejectedAt?: string;
    rejectedReason?: string;
    cancelledAt?: string;
    cancelledReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApprovalHistoryItem {
    step: number;
    approver: string;
    approverName: string;
    approverPosition?: string;
    action: 'pending' | 'approved' | 'rejected' | 'skipped';
    actionAt?: string;
    comment?: string;
}

export interface TeamLeaveRequest {
    id: string;
    type: LeaveTypeCode;
    typeName: string;
    durationType: LeaveDurationType;
    halfDayPeriod?: HalfDayPeriod;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    days: number;
    hours?: number;
    reason: string;
    attachments: string[];
    status: LeaveStatus;
    createdAt: string;
    employee: {
        id: string;
        name: string;
        position: string;
        avatar?: string;
    };
}

export interface Holiday {
    id: string;
    date: string;
    name: string;
    nameTh: string;
    description?: string;
    type: 'national' | 'religious' | 'special' | 'company';
    isRecurring: boolean;
    isPublished: boolean;
}

export interface CreateLeaveRequestDTO {
    leaveType: string;
    durationType: LeaveDurationType;
    halfDayPeriod?: HalfDayPeriod;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    attachments?: string[];
}

// UI Types
export interface LeaveQuota {
    type: LeaveTypeCode;
    typeId: string;
    typeName: string;
    color: string;
    total: number;
    used: number;
    pending: number;
    remaining: number;
    carryOver: number;
}

export interface PublicHoliday {
    date: Date;
    name: string;
}

export interface LeaveRequestUI {
    id: string;
    type: LeaveTypeCode;
    typeName: string;
    durationType: LeaveDurationType;
    halfDayPeriod?: HalfDayPeriod;
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    days: number;
    hours?: number;
    reason: string;
    status: LeaveStatus;
    attachments: string[];
    createdAt: Date;
    approvedAt?: Date;
    rejectReason?: string;
}

export interface TeamLeaveRequestUI {
    id: string;
    type: LeaveTypeCode;
    typeName: string;
    durationType: LeaveDurationType;
    halfDayPeriod?: HalfDayPeriod;
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    days: number;
    hours?: number;
    reason: string;
    status: LeaveStatus;
    attachments: string[];
    createdAt: Date;
    employee: {
        id: string;
        name: string;
        position: string;
        avatar?: string;
    };
}