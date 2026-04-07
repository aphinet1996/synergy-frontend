import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

const getAccessToken = (): string | null => {
    return useAuthStore.getState().tokens?.accessToken || null;
};

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

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

/**
 * Extract array from various API response structures
 * Handles: { data: [...] }, { data: { items: [...] } }, [...], etc.
 */
function extractArray<T>(data: any, possibleKeys: string[]): T[] {
    if (!data) return [];

    // If data is already an array
    if (Array.isArray(data)) return data;

    // Try each possible key
    for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
            return data[key];
        }
    }

    // If data.data exists, try recursively
    if (data.data) {
        return extractArray(data.data, possibleKeys);
    }

    return [];
}

/**
 * Extract object from API response
 * Handles: { data: {...} }, {...}
 */
function extractObject<T>(data: any): T | undefined {
    if (!data) return undefined;

    // If data.data exists, return it
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return data.data;
    }

    return data;
}

// Leave Types
export const getLeaveTypes = async (): Promise<ApiResponse<LeaveType[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/types`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch leave types: ${response.statusText}` };
        }

        const json = await response.json();
        // Handle: { data: { leaveTypes: [...] } } or { data: [...] } or { leaveTypes: [...] }
        const leaveTypes = extractArray<LeaveType>(json, ['leaveTypes', 'data', 'items']);

        return { success: true, data: leaveTypes };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

// Holidays
export const getHolidays = async (year?: number): Promise<ApiResponse<Holiday[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    const currentYear = year || new Date().getFullYear();

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/year/${currentYear}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch holidays: ${response.statusText}` };
        }

        const json = await response.json();
        // Handle: { data: { holidays: [...] } } or { data: [...] } or { holidays: [...] }
        const holidays = extractArray<Holiday>(json, ['holidays', 'data', 'items']);

        return { success: true, data: holidays };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getUpcomingHolidays = async (): Promise<ApiResponse<Holiday[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/upcoming`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch upcoming holidays: ${response.statusText}` };
        }

        const json = await response.json();
        const holidays = extractArray<Holiday>(json, ['holidays', 'data', 'items']);

        return { success: true, data: holidays };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

// Leave Balance
export const getMyBalance = async (year?: number): Promise<ApiResponse<LeaveBalanceResponse>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    const queryParams = year ? `?year=${year}` : '';

    try {
        const response = await fetch(`${API_BASE}/leave/balance${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch balance: ${response.statusText}` };
        }

        const json = await response.json();
        // Handle: { data: { year, balances, summary } } or { year, balances, summary }
        const balanceData = extractObject<LeaveBalanceResponse>(json);

        // Ensure balances is array
        if (balanceData && !Array.isArray(balanceData.balances)) {
            balanceData.balances = [];
        }

        return { success: true, data: balanceData };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const initializeMyBalance = async (year?: number): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/balance/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ year }),
        });

        if (!response.ok) {
            return { success: false, error: `Failed to initialize balance: ${response.statusText}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

// Leave Requests
export const getMyRequests = async (params?: {
    status?: LeaveStatus;
    year?: number;
    page?: number;
    limit?: number;
}): Promise<ApiResponse<{ requests: LeaveRequest[]; pagination: any }>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE}/leave/requests${queryString ? `?${queryString}` : ''}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch requests: ${response.statusText}` };
        }

        const json = await response.json();
        // Handle: { data: { requests: [...] } } or various structures
        const rawRequests = extractArray<any>(json, ['requests', 'data', 'items']);

        // Map _id to id for each request
        const requests = rawRequests.map((r) => ({
            ...r,
            id: r.id || r._id,
            leaveType: typeof r.leaveType === 'object' ? r.leaveType._id || r.leaveType.id : r.leaveType,
        }));

        const pagination = json.pagination || json.data?.pagination || {};

        return {
            success: true,
            data: {
                requests,
                pagination
            }
        };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getRequestById = async (id: string): Promise<ApiResponse<LeaveRequest>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/requests/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch request: ${response.statusText}` };
        }

        const json = await response.json();
        const request = extractObject<LeaveRequest>(json);

        return { success: true, data: request };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const createLeaveRequest = async (dto: CreateLeaveRequestDTO): Promise<ApiResponse<LeaveRequest>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to create request: ${response.statusText}` };
        }

        const json = await response.json();
        const request = extractObject<LeaveRequest>(json);

        return { success: true, data: request };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const cancelLeaveRequest = async (id: string, reason?: string): Promise<ApiResponse<LeaveRequest>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/requests/${id}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to cancel request: ${response.statusText}` };
        }

        const json = await response.json();
        const request = extractObject<LeaveRequest>(json);

        return { success: true, data: request };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

// Manager Functions
export const getPendingApprovals = async (): Promise<ApiResponse<TeamLeaveRequest[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/requests/pending/approvals`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // Return empty array for 403/404 (user might not be a manager)
            if (response.status === 403 || response.status === 404) {
                return { success: true, data: [] };
            }
            return { success: false, error: `Failed to fetch pending approvals: ${response.statusText}` };
        }

        const json = await response.json();
        // Handle: { data: { requests: [...] } } or { data: [...] } or { requests: [...] }
        const approvals = extractArray<TeamLeaveRequest>(json, ['requests', 'approvals', 'data', 'items']);

        return { success: true, data: approvals };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const approveLeaveRequest = async (id: string, comment?: string): Promise<ApiResponse<LeaveRequest>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/requests/${id}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ comment }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to approve request: ${response.statusText}` };
        }

        const json = await response.json();
        const request = extractObject<LeaveRequest>(json);

        return { success: true, data: request };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const rejectLeaveRequest = async (id: string, reason: string): Promise<ApiResponse<LeaveRequest>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/requests/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to reject request: ${response.statusText}` };
        }

        const json = await response.json();
        const request = extractObject<LeaveRequest>(json);

        return { success: true, data: request };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

// Export 
export const leaveService = {
    // Leave Types
    getLeaveTypes,

    // Holidays
    getHolidays,
    getUpcomingHolidays,

    // Balance
    getMyBalance,
    initializeMyBalance,

    // Requests
    getMyRequests,
    getRequestById,
    createLeaveRequest,
    cancelLeaveRequest,

    // Manager
    getPendingApprovals,
    approveLeaveRequest,
    rejectLeaveRequest,
};