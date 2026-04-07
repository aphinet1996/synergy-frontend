import { useAuthStore } from '@/stores/authStore';

export type AdjustmentType =
    | 'add'           // เพิ่มวันลา
    | 'deduct'        // หักวันลา
    | 'carry_over'    // ยกยอดข้ามปี
    | 'expired'       // วันลาหมดอายุ
    | 'correction'    // แก้ไขข้อผิดพลาด
    | 'bonus'         // โบนัสวันลา
    | 'transfer_in'   // รับโอนจากคนอื่น
    | 'transfer_out'; // โอนให้คนอื่น

export interface LeaveAdjustment {
    id: string;
    _id?: string;
    user: string | UserBasic;
    year: number;
    leaveType: string | LeaveTypeBasic;
    leaveTypeCode?: string;
    adjustmentType: AdjustmentType;
    days: number;
    balanceBefore: number;
    balanceAfter: number;
    reason: string;
    relatedUser?: string | UserBasic;
    sourceYear?: number;
    expiryDate?: string;
    adjustedBy: string | UserBasic;
    adjustedAt: string;
    requiresApproval: boolean;
    approvedBy?: string | UserBasic;
    approvedAt?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
    updatedAt?: string;
}

export interface UserBasic {
    id?: string;
    _id?: string;
    firstname: string;
    lastname: string;
    username?: string;
    employeeId?: string;
}

export interface LeaveTypeBasic {
    id?: string;
    _id?: string;
    code: string;
    name: string;
    color?: string;
}

export interface CreateAdjustmentDTO {
    user: string;
    year: number;
    leaveType: string;
    adjustmentType: AdjustmentType;
    days: number;
    reason: string;
    relatedUser?: string;
    sourceYear?: number;
    expiryDate?: string;
}

export interface TransferDTO {
    fromUser: string;
    toUser: string;
    leaveType: string;
    days: number;
    year: number;
    reason: string;
}

export interface BulkBonusDTO {
    userIds: string[];
    leaveType: string;
    days: number;
    year: number;
    reason: string;
}

export interface UserBalance {
    id: string;
    _id?: string;
    firstname: string;
    lastname: string;
    employeeId?: string;
    positionName?: string;
    departmentName?: string;
    balances: {
        leaveType: LeaveTypeBasic;
        total: number;
        used: number;
        pending: number;
        remaining: number;
    }[];
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function getAccessToken(): string | null {
    return useAuthStore.getState().tokens?.accessToken || null;
}

function extractArray<T>(data: any, possibleKeys: string[]): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;

    for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
            return data[key];
        }
    }

    if (data.data) {
        return extractArray(data.data, possibleKeys);
    }

    return [];
}

function extractObject<T>(data: any): T | undefined {
    if (!data) return undefined;

    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return data.data;
    }

    return data;
}

function mapIdFields<T extends Record<string, any>>(item: T): T {
    const getId = (val: any): string | undefined => {
        if (!val) return undefined;
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val.toString) return val.toString();
        return undefined;
    };

    return {
        ...item,
        id: getId(item.id) || getId(item._id),
        _id: getId(item._id) || getId(item.id),
    };
}

/**
 * สร้าง adjustment
 */
export const createAdjustment = async (dto: CreateAdjustmentDTO): Promise<ApiResponse<LeaveAdjustment>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/adjustments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to create adjustment',
            };
        }

        const data = extractObject<LeaveAdjustment>(result);
        return {
            success: true,
            data: data ? mapIdFields(data) : undefined,
        };
    } catch (error) {
        console.error('Create adjustment error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง adjustments ตาม user
 */
export const getAdjustmentsByUser = async (userId: string, year?: number): Promise<ApiResponse<LeaveAdjustment[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        let url = `${API_BASE_URL}/leave/adjustments/user/${userId}`;
        if (year) {
            url += `?year=${year}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch adjustments',
            };
        }

        const data = extractArray<LeaveAdjustment>(result, ['adjustments', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get adjustments error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง adjustments ทั้งหมด (admin)
 */
export const getAllAdjustments = async (year?: number): Promise<ApiResponse<LeaveAdjustment[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        let url = `${API_BASE_URL}/leave/adjustments`;
        if (year) {
            url += `?year=${year}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch adjustments',
            };
        }

        const data = extractArray<LeaveAdjustment>(result, ['adjustments', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get all adjustments error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * โอนวันลาระหว่าง users
 */
export const transferDays = async (dto: TransferDTO): Promise<ApiResponse<{ from: LeaveAdjustment; to: LeaveAdjustment }>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/adjustments/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to transfer days',
            };
        }

        const data = extractObject<{ from: LeaveAdjustment; to: LeaveAdjustment }>(result);
        return {
            success: true,
            data: data ? {
                from: mapIdFields(data.from),
                to: mapIdFields(data.to),
            } : undefined,
        };
    } catch (error) {
        console.error('Transfer days error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ให้โบนัสวันลาหลายคน
 */
export const bulkBonus = async (dto: BulkBonusDTO): Promise<ApiResponse<{ count: number }>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/adjustments/bulk-bonus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to add bulk bonus',
            };
        }

        return {
            success: true,
            data: { count: result.count || result.data?.count || 0 },
        };
    } catch (error) {
        console.error('Bulk bonus error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง pending approvals
 */
export const getPendingApprovals = async (): Promise<ApiResponse<LeaveAdjustment[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/adjustments/pending`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch pending approvals',
            };
        }

        const data = extractArray<LeaveAdjustment>(result, ['adjustments', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get pending approvals error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * อนุมัติ adjustment
 */
export const approveAdjustment = async (id: string): Promise<ApiResponse<LeaveAdjustment>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/adjustments/${id}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to approve adjustment',
            };
        }

        const data = extractObject<LeaveAdjustment>(result);
        return {
            success: true,
            data: data ? mapIdFields(data) : undefined,
        };
    } catch (error) {
        console.error('Approve adjustment error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ปฏิเสธ adjustment
 */
export const rejectAdjustment = async (id: string, reason: string): Promise<ApiResponse<LeaveAdjustment>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/adjustments/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to reject adjustment',
            };
        }

        const data = extractObject<LeaveAdjustment>(result);
        return {
            success: true,
            data: data ? mapIdFields(data) : undefined,
        };
    } catch (error) {
        console.error('Reject adjustment error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง users ทั้งหมด (สำหรับ dropdown)
 */
export const getUsers = async (): Promise<ApiResponse<UserBasic[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch users',
            };
        }

        const data = extractArray<UserBasic>(result, ['users', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get users error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง leave types ทั้งหมด
 */
export const getLeaveTypes = async (): Promise<ApiResponse<LeaveTypeBasic[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/types`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch leave types',
            };
        }

        const data = extractArray<LeaveTypeBasic>(result, ['leaveTypes', 'types', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get leave types error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง user balances ทั้งหมด (สำหรับ admin)
 */
export const getAllUserBalances = async (year?: number): Promise<ApiResponse<UserBalance[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        let url = `${API_BASE_URL}/leave/balances/all`;
        if (year) {
            url += `?year=${year}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch user balances',
            };
        }

        const data = extractArray<UserBalance>(result, ['balances', 'users', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get all user balances error:', error);
        return { success: false, error: 'Network error' };
    }
};

// Export service object
export const leaveAdjustmentService = {
    createAdjustment,
    getAdjustmentsByUser,
    getAllAdjustments,
    transferDays,
    bulkBonus,
    getPendingApprovals,
    approveAdjustment,
    rejectAdjustment,
    getUsers,
    getLeaveTypes,
    getAllUserBalances,
};

export default leaveAdjustmentService;