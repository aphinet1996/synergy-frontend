import { useAuthStore } from '@/stores/authStore';

export interface Position {
    id?: string;
    _id?: string;
    name: string;
    code?: string;
}

export interface LeaveTypeBasic {
    id?: string;
    _id?: string;
    code: string;
    name: string;
    color?: string;
}

export interface ApprovalStep {
    stepOrder: number;
    approverPosition: string | Position;
    approverPositionName?: string;
    canSkip: boolean;
    autoApproveAfterDays?: number | null;
}

export interface ApprovalFlow {
    id: string;
    _id?: string;
    name: string;
    description?: string;
    requesterPosition: string | Position;
    requesterPositionName?: string;
    leaveTypes?: (string | LeaveTypeBasic)[];
    steps: ApprovalStep[];
    isDefault: boolean;
    isActive: boolean;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateApprovalFlowDTO {
    name: string;
    description?: string;
    requesterPosition: string;
    leaveTypes?: string[];
    steps: {
        stepOrder: number;
        approverPosition: string;
        canSkip: boolean;
        autoApproveAfterDays?: number | null;
    }[];
    isDefault: boolean;
}

export interface UpdateApprovalFlowDTO extends Partial<CreateApprovalFlowDTO> { }

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
        if (typeof val === 'object' && val._id) return val._id.toString();
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
 * ดึง Approval Flows ทั้งหมด
 */
export const getApprovalFlows = async (): Promise<ApiResponse<ApprovalFlow[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/approval-flows`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch approval flows',
            };
        }

        const data = extractArray<ApprovalFlow>(result, ['flows', 'approvalFlows', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get approval flows error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง Approval Flow by ID
 */
export const getApprovalFlowById = async (id: string): Promise<ApiResponse<ApprovalFlow>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/approval-flows/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch approval flow',
            };
        }

        const data = extractObject<ApprovalFlow>(result);
        return {
            success: true,
            data: data ? mapIdFields(data) : undefined,
        };
    } catch (error) {
        console.error('Get approval flow error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * สร้าง Approval Flow
 */
export const createApprovalFlow = async (dto: CreateApprovalFlowDTO): Promise<ApiResponse<ApprovalFlow>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/approval-flows`, {
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
                error: result.message || result.error || 'Failed to create approval flow',
            };
        }

        const data = extractObject<ApprovalFlow>(result);
        return {
            success: true,
            data: data ? mapIdFields(data) : undefined,
        };
    } catch (error) {
        console.error('Create approval flow error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * อัพเดท Approval Flow
 */
export const updateApprovalFlow = async (id: string, dto: UpdateApprovalFlowDTO): Promise<ApiResponse<ApprovalFlow>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/approval-flows/${id}`, {
            method: 'PUT',
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
                error: result.message || result.error || 'Failed to update approval flow',
            };
        }

        const data = extractObject<ApprovalFlow>(result);
        return {
            success: true,
            data: data ? mapIdFields(data) : undefined,
        };
    } catch (error) {
        console.error('Update approval flow error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ลบ Approval Flow (soft delete)
 */
export const deleteApprovalFlow = async (id: string): Promise<ApiResponse<boolean>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/leave/approval-flows/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const result = await response.json();
            return {
                success: false,
                error: result.message || result.error || 'Failed to delete approval flow',
            };
        }

        return { success: true, data: true };
    } catch (error) {
        console.error('Delete approval flow error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง Positions ทั้งหมด
 */
export const getPositions = async (): Promise<ApiResponse<Position[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/position/active`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || result.error || 'Failed to fetch positions',
            };
        }

        const data = extractArray<Position>(result, ['positions', 'data']);
        return {
            success: true,
            data: data.map(mapIdFields),
        };
    } catch (error) {
        console.error('Get positions error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * ดึง Leave Types ทั้งหมด
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

// Export service object
export const approvalFlowService = {
    getApprovalFlows,
    getApprovalFlowById,
    createApprovalFlow,
    updateApprovalFlow,
    deleteApprovalFlow,
    getPositions,
    getLeaveTypes,
};

export default approvalFlowService;