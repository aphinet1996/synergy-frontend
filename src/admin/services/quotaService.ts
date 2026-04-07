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

export interface Position {
    id: string;
    _id?: string;
    name: string;
    level?: number;
    department?: string;
    isActive?: boolean;
}

export interface LeaveTypeBasic {
    id: string;
    _id?: string;
    code: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface QuotaItem {
    leaveType: string | LeaveTypeBasic;
    leaveTypeCode?: string;
    days: number;
}

export interface LeaveQuota {
    id: string;
    _id?: string;
    year: number;
    position?: string | Position;
    positionName?: string;
    employeeType?: 'permanent' | 'probation' | 'freelance' | null;
    quotas: QuotaItem[];
    isDefault: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateLeaveQuotaDTO {
    year: number;
    position?: string;
    employeeType?: 'permanent' | 'probation' | 'freelance';
    quotas: {
        leaveType: string;
        days: number;
    }[];
    isDefault?: boolean;
}

export interface UpdateLeaveQuotaDTO {
    year?: number;
    position?: string | null;
    employeeType?: 'permanent' | 'probation' | 'freelance' | null;
    quotas?: {
        leaveType: string;
        days: number;
    }[];
    isDefault?: boolean;
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
    // Handle MongoDB ObjectId (could be string or object with toString())
    const getId = (val: any): string | undefined => {
        if (!val) return undefined;
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val.toString) return val.toString();
        return undefined;
    };

    return {
        ...item,
        id: getId(item.id) || getId(item._id),
        _id: getId(item._id) || getId(item.id), // Keep _id for compatibility
    };
}

export const getLeaveQuotasByYear = async (year: number): Promise<ApiResponse<LeaveQuota[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/quotas/year/${year}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { success: true, data: [] };
            }
            return { success: false, error: `Failed to fetch leave quotas: ${response.statusText}` };
        }

        const json = await response.json();
        const rawQuotas = extractArray<any>(json, ['quotas', 'data', 'items']);
        const quotas = rawQuotas.map(mapIdFields);

        return { success: true, data: quotas };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getLeaveQuotaById = async (id: string): Promise<ApiResponse<LeaveQuota>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/quotas/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch leave quota: ${response.statusText}` };
        }

        const json = await response.json();
        const quota = extractObject<LeaveQuota>(json);

        return { success: true, data: quota ? mapIdFields(quota) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const createLeaveQuota = async (dto: CreateLeaveQuotaDTO): Promise<ApiResponse<LeaveQuota>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/quotas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to create leave quota: ${response.statusText}` };
        }

        const json = await response.json();
        const quota = extractObject<LeaveQuota>(json);

        return { success: true, data: quota ? mapIdFields(quota) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const updateLeaveQuota = async (id: string, dto: UpdateLeaveQuotaDTO): Promise<ApiResponse<LeaveQuota>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/quotas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to update leave quota: ${response.statusText}` };
        }

        const json = await response.json();
        const quota = extractObject<LeaveQuota>(json);

        return { success: true, data: quota ? mapIdFields(quota) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const deleteLeaveQuota = async (id: string): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/quotas/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to delete leave quota: ${response.statusText}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const copyLeaveQuotasToYear = async (fromYear: number, toYear: number): Promise<ApiResponse<{ count: number }>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/quotas/copy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fromYear, toYear }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to copy leave quotas: ${response.statusText}` };
        }

        const json = await response.json();
        return { success: true, data: { count: json.count || 0 } };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getPositions = async (): Promise<ApiResponse<Position[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/position/active`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch positions: ${response.statusText}` };
        }

        const json = await response.json();
        const rawPositions = extractArray<any>(json, ['positions', 'data', 'items']);
        const positions = rawPositions.map(mapIdFields);

        return { success: true, data: positions };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getLeaveTypes = async (): Promise<ApiResponse<LeaveTypeBasic[]>> => {
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
        const rawTypes = extractArray<any>(json, ['leaveTypes', 'types', 'data', 'items']);
        const types = rawTypes.map(mapIdFields);

        return { success: true, data: types };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const leaveQuotaService = {
    getLeaveQuotasByYear,
    getLeaveQuotaById,
    createLeaveQuota,
    updateLeaveQuota,
    deleteLeaveQuota,
    copyLeaveQuotasToYear,
    getPositions,
    getLeaveTypes,
};