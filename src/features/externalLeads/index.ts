
export type {
   // Lead Types
   Lead,
   LeadPatient,
   LeadClinic,
   LeadAppointment,
   LeadInterest,
   LeadProcedure,
   LeadPayment,
   LeadListParams,
   CreateLeadDTO,
   UpdateLeadDTO,

   // Clinic User Types
   ClinicUser,
   ClinicUserListParams,
   CreateClinicUserDTO,
   UpdateClinicUserDTO,

   // Patient Types
   Patient,
   PatientListParams,
   CreatePatientDTO,
   UpdatePatientDTO,
   PatientTransaction,
   DepositDTO,
   UseDepositDTO,
   RefundDTO,
   AdjustBalanceDTO,

   // Stats Types
   LeadOverviewStats,
   LeadFinanceStats,
   LeadInterestStat,
   LeadTrendStat,
   LeadClinicStat,
   StatsParams,

   // Activity Types
   Activity,
   ActivityAction,
   ActivityResource,
   ActivityListParams,
   CreateActivityDTO,
   ActivityStats,

   // Options Types
   ClinicOption,
   ClinicOptionsData,
   AllOptionsData,
   SelectOption,
   StatusOption,
   FormSchema,
   FormSchemaField,

   // Common Types
   Pagination,
   ApiResponse,
} from '@/types/externalLeads';

// ==================== Services ====================
export {
   leadsApi,
   clinicUsersApi,
   statsApi,
   activityApi,
   optionsApi,
   patientsApi,
   logExternalActivity,
   externalLeadsService,
} from '@/services/externalLeadsService';

// ==================== Stores ====================
export {
   useLeadsStore,
   useClinicUsersStore,
   useLeadsStatsStore,
   usePatientsStore,
} from '@/stores/externalLeadsStore';

// ==================== Pages ====================
// Note: Import these directly from their files to avoid circular dependencies
// import LeadsManagement from '@/pages/admin/LeadsManagement';
// import ClinicUsersManagement from '@/pages/admin/ClinicUsersManagement';
// import LeadsStats from '@/pages/admin/LeadsStats';
// import PatientsManagement from '@/pages/admin/PatientsManagement';

// ==================== Usage Example ====================
/*

1. Add environment variables to .env:
  VITE_LEADS_API_URL=/lead/external/v1/api
  VITE_LEADS_API_KEY=your-api-key-here

2. Add proxy to vite.config.ts:
  server: {
    proxy: {
      '/lead/external/v1/api': {
        target: 'http://localhost:YOUR_PORT',
        changeOrigin: true,
      }
    }
  }

3. Add routes to your router (e.g., index.tsx):

  import LeadsManagement from '@/pages/admin/LeadsManagement';
  import ClinicUsersManagement from '@/pages/admin/ClinicUsersManagement';
  import LeadsStats from '@/pages/admin/LeadsStats';
  import PatientsManagement from '@/pages/admin/PatientsManagement';

  // Inside your admin routes:
  { path: 'leads', element: <LeadsManagement /> },
  { path: 'leads/stats', element: <LeadsStats /> },
  { path: 'clinic-users', element: <ClinicUsersManagement /> },
  { path: 'patients', element: <PatientsManagement /> },

4. Add navigation items to AdminLayout.tsx:

  {
    title: 'Leads Management',
    icon: <TrendingUp className="h-5 w-5" />,
    children: [
      { title: 'รายการ Leads', href: '/admin/leads' },
      { title: 'จัดการคนไข้', href: '/admin/patients' },
      { title: 'สถิติ Leads', href: '/admin/leads/stats' },
      { title: 'ผู้ใช้คลินิก', href: '/admin/clinic-users' },
    ],
  }

5. To log activities from other parts of Synergy:

  import { logExternalActivity } from '@/features/externalLeads';

  // Log an action
  await logExternalActivity('create', 'lead', 'Created new lead via Synergy', {
    resourceId: leadId,
    resourceName: 'Patient Name',
    clinicId: 101,
    clinicName: 'Clinic Name',
  });

6. To use Patient wallet operations:

  import { usePatientsStore } from '@/features/externalLeads';

  const { addDeposit, useDeposit, refundDeposit } = usePatientsStore();

  // Add deposit
  await addDeposit(patientId, {
    clinic_id: 101,
    amount: 1000,
    description: 'มัดจำค่าบริการ',
  });

*/