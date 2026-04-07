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

// Position
export interface Position {
    id: string;
    name: string;
    level: number;
    department?: string;
    isActive: boolean;
}

// Holiday
export interface Holiday {
    id: string;
    date: string;
    name: string;
    nameTh: string;
    description?: string;
    type: 'national' | 'religious' | 'special' | 'company';
    year: number;
    isRecurring: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHolidayDTO {
    date: string;
    name: string;
    nameTh: string;
    description?: string;
    type: 'national' | 'religious' | 'special' | 'company';
    isRecurring?: boolean;
}

export interface UpdateHolidayDTO extends Partial<CreateHolidayDTO> {
    isPublished?: boolean;
}

// Leave Type (Admin version with more fields)
export interface LeaveTypeAdmin {
    id: string;
    code: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    defaultDays: number;
    maxDaysPerRequest?: number;
    minDaysPerRequest?: number;
    requireApproval: boolean;
    allowHalfDay: boolean;
    allowHours: boolean;
    allowPastDate: boolean;
    pastDateLimit?: number;
    requireAttachment: boolean;
    attachmentAfterDays?: number;
    isActive: boolean;
    sortOrder: number;
    // Conditions
    minServiceMonths?: number;
    requireProbationPassed?: boolean;
    employeeTypes?: ('permanent' | 'probation' | 'freelance')[];
    advanceNoticeDays?: number;
    maxUsagePerYear?: number;
    allowCarryOver?: boolean;
    carryOverMaxDays?: number;
    carryOverExpiryMonths?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLeaveTypeDTO {
    code: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    defaultDays: number;
    maxDaysPerRequest?: number;
    minDaysPerRequest?: number;
    requireApproval?: boolean;
    allowHalfDay?: boolean;
    allowHours?: boolean;
    allowPastDate?: boolean;
    pastDateLimit?: number;
    requireAttachment?: boolean;
    attachmentAfterDays?: number;
    sortOrder?: number;
    // Conditions
    minServiceMonths?: number;
    requireProbationPassed?: boolean;
    employeeTypes?: string[];
    advanceNoticeDays?: number;
    maxUsagePerYear?: number;
    allowCarryOver?: boolean;
    carryOverMaxDays?: number;
    carryOverExpiryMonths?: number;
}

export interface UpdateLeaveTypeDTO extends Partial<CreateLeaveTypeDTO> {
    isActive?: boolean;
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
    return {
        ...item,
        id: item.id || item._id,
    };
}

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

export const getHolidaysByYear = async (year: number): Promise<ApiResponse<Holiday[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/year/${year}`, {
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
            return { success: false, error: `Failed to fetch holidays: ${response.statusText}` };
        }

        const json = await response.json();
        const rawHolidays = extractArray<any>(json, ['holidays', 'data', 'items']);
        const holidays = rawHolidays.map(mapIdFields);

        return { success: true, data: holidays };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getHolidayYears = async (): Promise<ApiResponse<number[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/years`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to fetch holiday years: ${response.statusText}` };
        }

        const json = await response.json();
        const years = extractArray<number>(json, ['years', 'data']);

        return { success: true, data: years };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const createHoliday = async (dto: CreateHolidayDTO): Promise<ApiResponse<Holiday>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to create holiday: ${response.statusText}` };
        }

        const json = await response.json();
        const holiday = extractObject<Holiday>(json);

        return { success: true, data: holiday ? mapIdFields(holiday) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const updateHoliday = async (id: string, dto: UpdateHolidayDTO): Promise<ApiResponse<Holiday>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to update holiday: ${response.statusText}` };
        }

        const json = await response.json();
        const holiday = extractObject<Holiday>(json);

        return { success: true, data: holiday ? mapIdFields(holiday) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const deleteHoliday = async (id: string): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to delete holiday: ${response.statusText}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const publishHolidays = async (year: number, isPublished: boolean): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/year/${year}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isPublished }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to publish holidays: ${response.statusText}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const copyHolidaysFromYear = async (fromYear: number, toYear: number): Promise<ApiResponse<Holiday[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/holidays/copy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fromYear, toYear }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to copy holidays: ${response.statusText}` };
        }

        const json = await response.json();
        const rawHolidays = extractArray<any>(json, ['holidays', 'data', 'items']);
        const holidays = rawHolidays.map(mapIdFields);

        return { success: true, data: holidays };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const getLeaveTypesAdmin = async (): Promise<ApiResponse<LeaveTypeAdmin[]>> => {
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

export const createLeaveType = async (dto: CreateLeaveTypeDTO): Promise<ApiResponse<LeaveTypeAdmin>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/types`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to create leave type: ${response.statusText}` };
        }

        const json = await response.json();
        const leaveType = extractObject<LeaveTypeAdmin>(json);

        return { success: true, data: leaveType ? mapIdFields(leaveType) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const updateLeaveType = async (id: string, dto: UpdateLeaveTypeDTO): Promise<ApiResponse<LeaveTypeAdmin>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/types/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to update leave type: ${response.statusText}` };
        }

        const json = await response.json();
        const leaveType = extractObject<LeaveTypeAdmin>(json);

        return { success: true, data: leaveType ? mapIdFields(leaveType) : undefined };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const deleteLeaveType = async (id: string): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/leave/types/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to delete leave type: ${response.statusText}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const leaveAdminService = {
    // Positions
    getPositions,

    // Holidays
    getHolidaysByYear,
    getHolidayYears,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    publishHolidays,
    copyHolidaysFromYear,

    // Leave Types
    getLeaveTypesAdmin,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
};