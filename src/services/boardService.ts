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

export interface Procedure {
    id: string;
    name: string;
}

export interface BoardMember {
    _id?: string;
    id?: string;
    firstname: string;
    lastname: string;
    nickname?: string;
}

export interface Board {
    _id?: string;
    id?: string;
    clinicId: string;
    procedureId: string | { _id?: string; id?: string; name: string };
    name: string;
    description?: string;
    members: BoardMember[];
    createdBy: BoardMember;
    updatedBy?: BoardMember;
    createdAt: string;
    updatedAt: string;
}

export interface BoardWithElements extends Board {
    elements: any[];
    appState?: Record<string, any>;
    files?: Record<string, any>;
}

export interface ProcedureWithBoards {
    procedure: {
        _id?: string;
        id?: string;
        name: string;
    };
    boards: Board[];
}

/**
 * GET /clinic/:id/procedures - Get clinic procedures
 */
export const getClinicProcedures = async (clinicId: string): Promise<ApiResponse<Procedure[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/procedures`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to fetch procedures: ${response.statusText}` };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: 'Failed to fetch procedures' };
        }

        return { success: true, data: data.data.procedures };
    } catch (error) {
        console.error('Get procedures error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * GET /clinic/:id/boards - Get all boards grouped by procedure (metadata only)
 */
export const getBoardsByClinic = async (clinicId: string): Promise<ApiResponse<ProcedureWithBoards[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to fetch boards: ${response.statusText}` };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: 'Failed to fetch boards' };
        }

        return { success: true, data: data.data.procedures };
    } catch (error) {
        console.error('Get boards error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * GET /clinic/:id/boards/procedure/:procedureId - Get boards for a procedure
 */
export const getBoardsByProcedure = async (
    clinicId: string,
    procedureId: string
): Promise<ApiResponse<Board[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards/procedure/${procedureId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to fetch boards: ${response.statusText}` };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: 'Failed to fetch boards' };
        }

        return { success: true, data: data.data.boards };
    } catch (error) {
        console.error('Get boards by procedure error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * GET /clinic/:id/boards/:boardId - Get single board with Excalidraw data
 */
export const getBoard = async (
    clinicId: string,
    boardId: string
): Promise<ApiResponse<BoardWithElements>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards/${boardId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to fetch board: ${response.statusText}` };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: 'Failed to fetch board' };
        }

        return { success: true, data: data.data.board };
    } catch (error) {
        console.error('Get board error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * POST /clinic/:id/boards - Create new board
 */
export const createBoard = async (
    clinicId: string,
    data: {
        procedureId: string;
        name: string;
        description?: string;
        members?: string[];
    }
): Promise<ApiResponse<Board>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to create board: ${response.statusText}` };
        }

        const result = await response.json();
        if (result.status !== 'success') {
            return { success: false, error: 'Failed to create board' };
        }

        return { success: true, data: result.data.board };
    } catch (error) {
        console.error('Create board error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * PUT /clinic/:id/boards/:boardId - Update board info
 */
export const updateBoard = async (
    clinicId: string,
    boardId: string,
    data: {
        name?: string;
        description?: string;
        members?: string[];
    }
): Promise<ApiResponse<Board>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards/${boardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to update board: ${response.statusText}` };
        }

        const result = await response.json();
        if (result.status !== 'success') {
            return { success: false, error: 'Failed to update board' };
        }

        return { success: true, data: result.data.board };
    } catch (error) {
        console.error('Update board error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * PUT /clinic/:id/boards/:boardId/elements - Save Excalidraw data
 */
export const saveBoardElements = async (
    clinicId: string,
    boardId: string,
    data: {
        elements?: any[];
        appState?: Record<string, any>;
        files?: Record<string, any>;
    }
): Promise<ApiResponse<BoardWithElements>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards/${boardId}/elements`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to save board: ${response.statusText}` };
        }

        const result = await response.json();
        if (result.status !== 'success') {
            return { success: false, error: 'Failed to save board' };
        }

        return { success: true, data: result.data.board };
    } catch (error) {
        console.error('Save board elements error:', error);
        return { success: false, error: 'Network error' };
    }
};

/**
 * DELETE /clinic/:id/boards/:boardId - Delete board
 */
export const deleteBoard = async (
    clinicId: string,
    boardId: string
): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/clinic/${clinicId}/boards/${boardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `Failed to delete board: ${response.statusText}` };
        }

        return { success: true };
    } catch (error) {
        console.error('Delete board error:', error);
        return { success: false, error: 'Network error' };
    }
};

export const boardService = {
    getClinicProcedures,
    getBoardsByClinic,
    getBoardsByProcedure,
    getBoard,
    createBoard,
    updateBoard,
    saveBoardElements,
    deleteBoard,
};