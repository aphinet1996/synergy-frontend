export interface Procedure {
    id: string;
    name: string;
    isActive: boolean;
    createdBy: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProcedureListParams {
    search?: string;
    isActive?: 'true' | 'false' | 'all';
    sort?: 'newest' | 'name';
    page?: number;
    limit?: number;
}

export interface ProcedureListResponse {
    status: 'success';
    results: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    data: {
        procedures: Procedure[];
    };
}

export interface ProcedureDetailResponse {
    status: 'success';
    data: {
        procedure: Procedure;
    };
}

export interface CreateProcedureRequest {
    name: string;
}

export interface UpdateProcedureRequest {
    name?: string;
    isActive?: boolean;
}