// src/hooks/useClinic.ts

import { useEffect, useState } from 'react';
import { useClinicStore } from '@/stores/clinicStore';
import type { Clinic, ClinicListParams } from '@/types/clinic';

/**
 * Hook สำหรับจัดการ clinics list
 */
export function useClinics(params?: ClinicListParams) {
  const { clinics, loading, error, fetchClinics } = useClinicStore();

  useEffect(() => {
    fetchClinics(params);
  }, [fetchClinics, params]);

  return {
    clinics,
    loading,
    error,
    refetch: () => fetchClinics(params),
  };
}

/**
 * Hook สำหรับ single clinic by ID
 */
export function useClinicById(id: string) {
  const { getClinicById, loading, error } = useClinicStore();
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    if (id) {
      getClinicById(id).then(setClinic);
    }
  }, [id, getClinicById]);

  return { clinic, loading, error, refetch: () => getClinicById(id).then(setClinic) };
}

/**
 * Combined hook สำหรับ clinic page (loads list + pagination)
 */
export function useClinicPage(params?: ClinicListParams) {
  const { clinics, pagination, loading, error, createClinic, updateClinic, setPage } = useClinicStore();

  useEffect(() => {
    useClinicStore.getState().fetchClinics(params);
  }, [params]);

  return {
    clinics,
    pagination,
    loading,
    error,
    createClinic,
    updateClinic,
    setPage,
    refetch: () => useClinicStore.getState().fetchClinics(params),
  };
}