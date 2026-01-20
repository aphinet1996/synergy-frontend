import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper: Get access token from authStore
const getAccessToken = (): string | null => {
    return useAuthStore.getState().tokens?.accessToken || null;
};

// Types
export type UploadFolder = 'clinics' | 'tasks' | 'users' | 'general';
export type FileType = 'image' | 'document' | 'any';

export interface UploadResponse {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    folder: UploadFolder;
    category: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Upload single image
 * POST /api/v1/uploads/image?folder=clinics
 */
export const uploadImage = async (
    file: File,
    folder: UploadFolder = 'general'
): Promise<ApiResponse<UploadResponse>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE}/uploads/image?folder=${folder}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // ❌ ไม่ต้องใส่ Content-Type เพราะ FormData จะ set เอง
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Upload failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: data.message || 'Upload failed' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Network error during upload' };
    }
};

/**
 * Upload multiple images
 * POST /api/v1/uploads/images?folder=clinics
 */
export const uploadImages = async (
    files: File[],
    folder: UploadFolder = 'general'
): Promise<ApiResponse<UploadResponse[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await fetch(`${API_BASE}/uploads/images?folder=${folder}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Upload failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: data.message || 'Upload failed' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Network error during upload' };
    }
};

/**
 * Upload single file (image or document)
 * POST /api/v1/uploads/file?folder=tasks&type=any
 */
export const uploadFile = async (
    file: File,
    folder: UploadFolder = 'general',
    type: FileType = 'any'
): Promise<ApiResponse<UploadResponse>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/uploads/file?folder=${folder}&type=${type}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Upload failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: data.message || 'Upload failed' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Network error during upload' };
    }
};

/**
 * Upload multiple files
 * POST /api/v1/uploads/files?folder=tasks&type=any
 */
export const uploadFiles = async (
    files: File[],
    folder: UploadFolder = 'general',
    type: FileType = 'any'
): Promise<ApiResponse<UploadResponse[]>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_BASE}/uploads/files?folder=${folder}&type=${type}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Upload failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: data.message || 'Upload failed' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Network error during upload' };
    }
};

/**
 * Upload single document
 * POST /api/v1/uploads/document?folder=tasks
 */
export const uploadDocument = async (
    file: File,
    folder: UploadFolder = 'general'
): Promise<ApiResponse<UploadResponse>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch(`${API_BASE}/uploads/document?folder=${folder}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Upload failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: data.message || 'Upload failed' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Network error during upload' };
    }
};

/**
 * Delete file by URL
 * POST /api/v1/uploads/delete-by-url
 */
export const deleteFileByUrl = async (url: string): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/uploads/delete-by-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Delete failed: ${response.statusText}`
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'Network error during delete' };
    }
};

/**
 * Delete multiple files by URLs
 * POST /api/v1/uploads/delete-multiple
 */
export const deleteMultipleFiles = async (
    urls: string[]
): Promise<ApiResponse<{ deleted: string[]; failed: string[] }>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/uploads/delete-multiple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ urls }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Delete failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        return { success: true, data: data.data };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'Network error during delete' };
    }
};

/**
 * Check if file exists
 * GET /api/v1/uploads/check/:filename?folder=tasks
 */
export const checkFile = async (
    filename: string,
    folder: UploadFolder = 'general'
): Promise<ApiResponse<{ exists: boolean; url?: string; size?: number }>> => {
    const token = getAccessToken();
    if (!token) {
        return { success: false, error: 'No access token available' };
    }

    try {
        const response = await fetch(`${API_BASE}/uploads/check/${filename}?folder=${folder}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Check failed: ${response.statusText}`
            };
        }

        const data = await response.json();
        return { success: true, data: data.data };
    } catch (error) {
        console.error('Check error:', error);
        return { success: false, error: 'Network error during check' };
    }
};

// Export all functions
export const uploadService = {
    uploadImage,
    uploadImages,
    uploadFile,
    uploadFiles,
    uploadDocument,
    deleteFileByUrl,
    deleteMultipleFiles,
    checkFile,
};

export default uploadService;