import { useState, useCallback } from 'react';
import api from '@/services/api';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
}

export function useApi<T>(
  apiCall: (...args: unknown[]) => Promise<{ data: { data: T } }>
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall(...args);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; errors?: { msg: string }[] }>;
      const msg = axiosErr.response?.data?.errors?.[0]?.msg
        || axiosErr.response?.data?.message
        || 'Erreur inattendue';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return { data, loading, error, execute };
}

export function useQuery<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: T }>(url);
      setData(res.data.data);
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, refetch };
}
