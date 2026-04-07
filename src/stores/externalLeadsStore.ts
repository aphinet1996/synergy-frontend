import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    Lead,
    LeadListParams,
    CreateLeadDTO,
    UpdateLeadDTO,
    ClinicUser,
    ClinicUserListParams,
    CreateClinicUserDTO,
    UpdateClinicUserDTO,
    LeadOverviewStats,
    LeadFinanceStats,
    LeadInterestStat,
    LeadTrendStat,
    LeadClinicStat,
    StatsParams,
    Pagination,
    Patient,
    PatientListParams,
    CreatePatientDTO,
    UpdatePatientDTO,
    PatientTransaction,
    DepositDTO,
    UseDepositDTO,
    RefundDTO,
    AdjustBalanceDTO,
} from '@/types/externalLeads';
import { leadsApi, clinicUsersApi, statsApi, patientsApi, logExternalActivity } from '@/services/externalLeadsService';

// Leads Store

interface LeadsState {
    leads: Lead[];
    selectedLead: Lead | null;
    leadHistory: Lead[];
    pagination: Pagination | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Actions
    fetchLeads: (params?: LeadListParams) => Promise<void>;
    fetchLeadById: (id: string) => Promise<Lead | null>;
    fetchLeadsByPhone: (phone: string) => Promise<Lead[]>;
    fetchLeadsByClinic: (clinicId: number, params?: { status?: string; limit?: number }) => Promise<Lead[]>;
    fetchLeadHistory: (id: string, clinicId: number) => Promise<Lead[]>;
    createLead: (dto: CreateLeadDTO) => Promise<Lead | null>;
    updateLead: (id: string, clinicId: number, dto: UpdateLeadDTO) => Promise<boolean>;
    deleteLead: (id: string, clinicId: number) => Promise<boolean>;
    setSelectedLead: (lead: Lead | null) => void;
    clearError: () => void;
}

export const useLeadsStore = create<LeadsState>()(
    devtools(
        (set, get) => ({
            leads: [],
            selectedLead: null,
            leadHistory: [],
            pagination: null,
            isLoading: false,
            isSubmitting: false,
            error: null,

            fetchLeads: async (params?: LeadListParams) => {
                if (get().isLoading) return;
                set({ isLoading: true, error: null });

                const response = await leadsApi.list(params);

                if (response.success && response.data) {
                    set({
                        leads: response.data,
                        pagination: response.pagination || null,
                        isLoading: false,
                    });
                } else {
                    set({
                        error: response.error?.message || 'Failed to fetch leads',
                        isLoading: false,
                    });
                }
            },

            fetchLeadById: async (id: string) => {
                const response = await leadsApi.getById(id);
                if (response.success && response.data) {
                    set({ selectedLead: response.data });
                    return response.data;
                }
                set({ error: response.error?.message || 'Failed to fetch lead' });
                return null;
            },

            fetchLeadsByPhone: async (phone: string) => {
                set({ isLoading: true, error: null });
                const response = await leadsApi.getByPhone(phone);
                set({ isLoading: false });

                if (response.success && response.data) {
                    return response.data;
                }
                set({ error: response.error?.message || 'Failed to fetch leads' });
                return [];
            },

            fetchLeadsByClinic: async (clinicId: number, params?: { status?: string; limit?: number }) => {
                set({ isLoading: true, error: null });
                const response = await leadsApi.getByClinic(clinicId, params);
                set({ isLoading: false });

                if (response.success && response.data) {
                    return response.data;
                }
                set({ error: response.error?.message || 'Failed to fetch leads' });
                return [];
            },

            fetchLeadHistory: async (id: string, clinicId: number) => {
                const response = await leadsApi.getHistory(id, clinicId);
                if (response.success && response.data) {
                    // Handle both array and object with leads/data property
                    const historyData = Array.isArray(response.data)
                        ? response.data
                        : (response.data as any).leads || (response.data as any).data || [];
                    set({ leadHistory: historyData });
                    return historyData;
                }
                set({ leadHistory: [] });
                return [];
            },

            createLead: async (dto: CreateLeadDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await leadsApi.create(dto);

                if (response.success && response.data) {
                    // Log activity
                    await logExternalActivity('create', 'lead', `สร้าง Lead ใหม่: ${dto.patient.fullname}`, {
                        resourceId: response.data._id,
                        resourceName: dto.patient.fullname,
                        clinicId: dto.clinic.clinicId,
                        clinicName: dto.clinic.name,
                    });

                    // Refresh list
                    await get().fetchLeads();
                    set({ isSubmitting: false });
                    return response.data;
                }

                set({
                    error: response.error?.message || 'Failed to create lead',
                    isSubmitting: false,
                });
                return null;
            },

            updateLead: async (id: string, clinicId: number, dto: UpdateLeadDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await leadsApi.update(id, clinicId, dto);

                if (response.success) {
                    // Log activity
                    await logExternalActivity('update', 'lead', `แก้ไข Lead: ${response.data?.patient?.fullname}`, {
                        resourceId: id,
                        resourceName: response.data?.patient?.fullname,
                        clinicId,
                    });

                    // Refresh list
                    await get().fetchLeads();
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to update lead',
                    isSubmitting: false,
                });
                return false;
            },

            deleteLead: async (id: string, clinicId: number) => {
                set({ isSubmitting: true, error: null });

                // Get lead info before delete
                const lead = get().leads.find((l) => l._id === id);

                const response = await leadsApi.delete(id, clinicId);

                if (response.success) {
                    // Log activity
                    await logExternalActivity('delete', 'lead', `ลบ Lead: ${lead?.patient?.fullname}`, {
                        resourceId: id,
                        resourceName: lead?.patient?.fullname,
                        clinicId,
                    });

                    // Refresh list
                    await get().fetchLeads();
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to delete lead',
                    isSubmitting: false,
                });
                return false;
            },

            setSelectedLead: (lead) => set({ selectedLead: lead }),
            clearError: () => set({ error: null }),
        }),
        { name: 'LeadsStore' }
    )
);

// Clinic Users Store

interface ClinicUsersState {
    users: ClinicUser[];
    selectedUser: ClinicUser | null;
    pagination: Pagination | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Actions
    fetchUsers: (params?: ClinicUserListParams) => Promise<void>;
    fetchUserById: (id: string) => Promise<ClinicUser | null>;
    fetchUserByClinicId: (clinicId: number) => Promise<ClinicUser | null>;
    createUser: (dto: CreateClinicUserDTO) => Promise<boolean>;
    updateUser: (id: string, dto: UpdateClinicUserDTO) => Promise<boolean>;
    deleteUser: (id: string) => Promise<boolean>;
    setSelectedUser: (user: ClinicUser | null) => void;
    clearError: () => void;
}

export const useClinicUsersStore = create<ClinicUsersState>()(
    devtools(
        (set, get) => ({
            users: [],
            selectedUser: null,
            pagination: null,
            isLoading: false,
            isSubmitting: false,
            error: null,

            fetchUsers: async (params?: ClinicUserListParams) => {
                if (get().isLoading) return;
                set({ isLoading: true, error: null });

                const response = await clinicUsersApi.list(params);

                if (response.success && response.data) {
                    set({
                        users: response.data,
                        pagination: response.pagination || null,
                        isLoading: false,
                    });
                } else {
                    set({
                        error: response.error?.message || 'Failed to fetch users',
                        isLoading: false,
                    });
                }
            },

            fetchUserById: async (id: string) => {
                const response = await clinicUsersApi.getById(id);
                if (response.success && response.data) {
                    set({ selectedUser: response.data });
                    return response.data;
                }
                set({ error: response.error?.message || 'Failed to fetch user' });
                return null;
            },

            fetchUserByClinicId: async (clinicId: number) => {
                const response = await clinicUsersApi.getByClinicId(clinicId);
                if (response.success && response.data) {
                    set({ selectedUser: response.data });
                    return response.data;
                }
                return null;
            },

            createUser: async (dto: CreateClinicUserDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await clinicUsersApi.create(dto);

                if (response.success) {
                    // Log activity
                    await logExternalActivity('create', 'user', `สร้างผู้ใช้คลินิก: ${dto.username}`, {
                        resourceId: response.data?._id,
                        resourceName: dto.username,
                        metadata: { clinicName: dto.clinicName, branch: dto.branch },
                    });

                    // Refresh list
                    await get().fetchUsers();
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to create user',
                    isSubmitting: false,
                });
                return false;
            },

            updateUser: async (id: string, dto: UpdateClinicUserDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await clinicUsersApi.update(id, dto);

                if (response.success) {
                    // Log activity
                    await logExternalActivity('update', 'user', `แก้ไขผู้ใช้คลินิก: ${response.data?.username}`, {
                        resourceId: id,
                        resourceName: response.data?.username,
                    });

                    // Refresh list
                    await get().fetchUsers();
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to update user',
                    isSubmitting: false,
                });
                return false;
            },

            deleteUser: async (id: string) => {
                set({ isSubmitting: true, error: null });

                // Get user info before delete
                const user = get().users.find((u) => u._id === id);

                const response = await clinicUsersApi.delete(id);

                if (response.success) {
                    // Log activity
                    await logExternalActivity('delete', 'user', `ลบผู้ใช้คลินิก: ${user?.username}`, {
                        resourceId: id,
                        resourceName: user?.username,
                    });

                    // Refresh list
                    await get().fetchUsers();
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to delete user',
                    isSubmitting: false,
                });
                return false;
            },

            setSelectedUser: (user) => set({ selectedUser: user }),
            clearError: () => set({ error: null }),
        }),
        { name: 'ClinicUsersStore' }
    )
);

// Stats Store

interface LeadsStatsState {
    overview: LeadOverviewStats | null;
    finance: LeadFinanceStats | null;
    interests: LeadInterestStat[];
    trends: LeadTrendStat[];
    clinics: LeadClinicStat[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchOverview: (params?: StatsParams) => Promise<void>;
    fetchFinance: (params?: StatsParams) => Promise<void>;
    fetchInterests: (params?: StatsParams) => Promise<void>;
    fetchTrends: (params?: StatsParams) => Promise<void>;
    fetchByClinics: (params?: StatsParams) => Promise<void>;
    fetchAllStats: (params?: StatsParams) => Promise<void>;
    clearError: () => void;
}

export const useLeadsStatsStore = create<LeadsStatsState>()(
    devtools(
        (set) => ({
            overview: null,
            finance: null,
            interests: [],
            trends: [],
            clinics: [],
            isLoading: false,
            error: null,

            fetchOverview: async (params?: StatsParams) => {
                set({ isLoading: true, error: null });
                const response = await statsApi.getOverview(params);

                if (response.success && response.data) {
                    set({ overview: response.data, isLoading: false });
                } else {
                    set({ error: response.error?.message || 'Failed to fetch overview', isLoading: false });
                }
            },

            fetchFinance: async (params?: StatsParams) => {
                set({ isLoading: true, error: null });
                const response = await statsApi.getFinance(params);

                if (response.success && response.data) {
                    set({ finance: response.data, isLoading: false });
                } else {
                    set({ error: response.error?.message || 'Failed to fetch finance', isLoading: false });
                }
            },

            fetchInterests: async (params?: StatsParams) => {
                set({ isLoading: true, error: null });
                const response = await statsApi.getInterests(params);

                if (response.success && response.data) {
                    set({ interests: response.data, isLoading: false });
                } else {
                    set({ error: response.error?.message || 'Failed to fetch interests', isLoading: false });
                }
            },

            fetchTrends: async (params?: StatsParams) => {
                set({ isLoading: true, error: null });
                const response = await statsApi.getTrends(params);

                if (response.success && response.data) {
                    set({ trends: response.data, isLoading: false });
                } else {
                    set({ error: response.error?.message || 'Failed to fetch trends', isLoading: false });
                }
            },

            fetchByClinics: async (params?: StatsParams) => {
                set({ isLoading: true, error: null });
                const response = await statsApi.getByClinics(params);

                if (response.success && response.data) {
                    set({ clinics: response.data, isLoading: false });
                } else {
                    set({ error: response.error?.message || 'Failed to fetch clinics stats', isLoading: false });
                }
            },

            fetchAllStats: async (params?: StatsParams) => {
                set({ isLoading: true, error: null });

                const [overview, finance, interests, trends, clinics] = await Promise.all([
                    statsApi.getOverview(params),
                    statsApi.getFinance(params),
                    statsApi.getInterests(params),
                    statsApi.getTrends(params),
                    statsApi.getByClinics(params),
                ]);

                set({
                    overview: overview.success ? overview.data || null : null,
                    finance: finance.success ? finance.data || null : null,
                    interests: interests.success ? interests.data || [] : [],
                    trends: trends.success ? trends.data || [] : [],
                    clinics: clinics.success ? clinics.data || [] : [],
                    isLoading: false,
                });
            },

            clearError: () => set({ error: null }),
        }),
        { name: 'LeadsStatsStore' }
    )
);

// Patients Store

interface PatientsState {
    patients: Patient[];
    selectedPatient: Patient | null;
    transactions: PatientTransaction[];
    appointments: Lead[];
    pagination: Pagination | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Actions
    fetchPatients: (params: PatientListParams) => Promise<void>;
    fetchPatientById: (id: string, clinicId: number) => Promise<Patient | null>;
    createPatient: (dto: CreatePatientDTO) => Promise<boolean>;
    updatePatient: (id: string, dto: UpdatePatientDTO) => Promise<boolean>;
    fetchTransactions: (id: string, clinicId: number) => Promise<void>;
    fetchAppointments: (id: string, clinicId: number) => Promise<void>;
    addDeposit: (id: string, dto: DepositDTO) => Promise<boolean>;
    useDeposit: (id: string, dto: UseDepositDTO) => Promise<boolean>;
    refundDeposit: (id: string, dto: RefundDTO) => Promise<boolean>;
    adjustBalance: (id: string, dto: AdjustBalanceDTO) => Promise<boolean>;
    setSelectedPatient: (patient: Patient | null) => void;
    clearError: () => void;
}

export const usePatientsStore = create<PatientsState>()(
    devtools(
        (set) => ({
            patients: [],
            selectedPatient: null,
            transactions: [],
            appointments: [],
            pagination: null,
            isLoading: false,
            isSubmitting: false,
            error: null,

            fetchPatients: async (params: PatientListParams) => {
                set({ isLoading: true, error: null });
                const response = await patientsApi.list(params);

                if (response.success && response.data) {
                    set({
                        patients: response.data,
                        pagination: response.pagination || null,
                        isLoading: false,
                    });
                } else {
                    set({
                        error: response.error?.message || 'Failed to fetch patients',
                        isLoading: false,
                    });
                }
            },

            fetchPatientById: async (id: string, clinicId: number) => {
                set({ isLoading: true, error: null });
                const response = await patientsApi.getById(id, clinicId);

                if (response.success && response.data) {
                    set({ selectedPatient: response.data, isLoading: false });
                    return response.data;
                } else {
                    set({
                        error: response.error?.message || 'Failed to fetch patient',
                        isLoading: false,
                    });
                    return null;
                }
            },

            createPatient: async (dto: CreatePatientDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await patientsApi.create(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        patients: [response.data!, ...state.patients],
                        isSubmitting: false,
                    }));

                    // Log activity
                    logExternalActivity('create', 'patient', `สร้างข้อมูลคนไข้: ${dto.fullname}`, {
                        resourceId: response.data._id,
                        resourceName: dto.fullname,
                        clinicId: dto.clinic_id,
                    });

                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to create patient',
                    isSubmitting: false,
                });
                return false;
            },

            updatePatient: async (id: string, dto: UpdatePatientDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await patientsApi.update(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        patients: state.patients.map((p) => (p._id === id ? response.data! : p)),
                        selectedPatient: state.selectedPatient?._id === id ? response.data : state.selectedPatient,
                        isSubmitting: false,
                    }));

                    // Log activity
                    logExternalActivity('update', 'patient', `แก้ไขข้อมูลคนไข้: ${dto.fullname}`, {
                        resourceId: id,
                        resourceName: dto.fullname,
                        clinicId: dto.clinic_id,
                    });

                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to update patient',
                    isSubmitting: false,
                });
                return false;
            },

            fetchTransactions: async (id: string, clinicId: number) => {
                // Don't reset to [] before fetching - avoids unnecessary re-render
                set({ error: null });
                const response = await patientsApi.getTransactions(id, clinicId);

                if (response.success && response.data) {
                    // Handle both array and object with transactions property
                    const txData = Array.isArray(response.data)
                        ? response.data
                        : (response.data as any).transactions || [];
                    set({ transactions: txData });
                } else {
                    set({
                        transactions: [],
                        error: response.error?.message || 'Failed to fetch transactions',
                    });
                }
            },

            fetchAppointments: async (id: string, clinicId: number) => {
                // Don't reset to [] before fetching - avoids unnecessary re-render
                set({ error: null });
                const response = await patientsApi.getAppointments(id, clinicId);

                if (response.success && response.data) {
                    // Handle both array and object with appointments/data property
                    const apptData = Array.isArray(response.data)
                        ? response.data
                        : (response.data as any).appointments || (response.data as any).data || [];
                    set({ appointments: apptData });
                } else {
                    set({
                        appointments: [],
                        error: response.error?.message || 'Failed to fetch appointments',
                    });
                }
            },

            addDeposit: async (id: string, dto: DepositDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await patientsApi.addDeposit(id, dto);

                if (response.success && response.data) {
                    // Update patient balance in list
                    set((state) => ({
                        patients: state.patients.map((p) =>
                            p._id === id ? { ...p, balance: response.data!.balance } : p
                        ),
                        selectedPatient:
                            state.selectedPatient?._id === id
                                ? { ...state.selectedPatient, balance: response.data!.balance }
                                : state.selectedPatient,
                        isSubmitting: false,
                    }));

                    // Log activity
                    logExternalActivity('update', 'patient', `เพิ่มมัดจำ ${dto.amount.toLocaleString()} บาท ให้ ${response.data.fullname}`, {
                        resourceId: id,
                        resourceName: response.data.fullname,
                        clinicId: dto.clinic_id,
                        metadata: { amount: dto.amount, newBalance: response.data.balance },
                    });

                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to add deposit',
                    isSubmitting: false,
                });
                return false;
            },

            useDeposit: async (id: string, dto: UseDepositDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await patientsApi.useDeposit(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        patients: state.patients.map((p) =>
                            p._id === id ? { ...p, balance: response.data!.balance } : p
                        ),
                        selectedPatient:
                            state.selectedPatient?._id === id
                                ? { ...state.selectedPatient, balance: response.data!.balance }
                                : state.selectedPatient,
                        isSubmitting: false,
                    }));

                    logExternalActivity('update', 'patient', `ใช้มัดจำ ${dto.amount.toLocaleString()} บาท ของ ${response.data.fullname}`, {
                        resourceId: id,
                        resourceName: response.data.fullname,
                        clinicId: dto.clinic_id,
                        metadata: { amount: dto.amount, newBalance: response.data.balance },
                    });

                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to use deposit',
                    isSubmitting: false,
                });
                return false;
            },

            refundDeposit: async (id: string, dto: RefundDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await patientsApi.refund(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        patients: state.patients.map((p) =>
                            p._id === id ? { ...p, balance: response.data!.balance } : p
                        ),
                        selectedPatient:
                            state.selectedPatient?._id === id
                                ? { ...state.selectedPatient, balance: response.data!.balance }
                                : state.selectedPatient,
                        isSubmitting: false,
                    }));

                    logExternalActivity('update', 'patient', `คืนเงินมัดจำ ${dto.amount.toLocaleString()} บาท ให้ ${response.data.fullname}`, {
                        resourceId: id,
                        resourceName: response.data.fullname,
                        clinicId: dto.clinic_id,
                        metadata: { amount: dto.amount, newBalance: response.data.balance },
                    });

                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to refund deposit',
                    isSubmitting: false,
                });
                return false;
            },

            adjustBalance: async (id: string, dto: AdjustBalanceDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await patientsApi.adjustBalance(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        patients: state.patients.map((p) =>
                            p._id === id ? { ...p, balance: response.data!.balance } : p
                        ),
                        selectedPatient:
                            state.selectedPatient?._id === id
                                ? { ...state.selectedPatient, balance: response.data!.balance }
                                : state.selectedPatient,
                        isSubmitting: false,
                    }));

                    logExternalActivity('update', 'patient', `ปรับยอดเงิน ${dto.amount > 0 ? '+' : ''}${dto.amount.toLocaleString()} บาท ของ ${response.data.fullname}`, {
                        resourceId: id,
                        resourceName: response.data.fullname,
                        clinicId: dto.clinic_id,
                        metadata: { amount: dto.amount, description: dto.description, newBalance: response.data.balance },
                    });

                    return true;
                }

                set({
                    error: response.error?.message || 'Failed to adjust balance',
                    isSubmitting: false,
                });
                return false;
            },

            setSelectedPatient: (patient) => set({ selectedPatient: patient }),
            clearError: () => set({ error: null }),
        }),
        { name: 'PatientsStore' }
    )
);