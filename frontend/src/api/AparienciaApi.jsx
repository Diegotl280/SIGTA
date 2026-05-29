import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const COLORES_OFICIALES = {
  headerActivo: '#bb4433',
  footerFondo: '#525252',
  tarjetaEmpresa: '#f5adab',
  tarjetaTramite: '#fce2e4',
  loginFondo: '#f5adab',
  loginBoton: '#bb4433',
  loginAcento: '#781005',
};

export function getLogoInstitucionalUrl(apariencia) {
  if (!apariencia?.logoInstitucionalUrl) return null;
  const version = apariencia.updatedAt ? `?v=${new Date(apariencia.updatedAt).getTime()}` : '';
  return `${API_BASE_URL}${apariencia.logoInstitucionalUrl}${version}`;
}

export function useGetApariencia() {
  return useQuery({
    queryKey: ['aparienciaSistema'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/apariencia`);
      return res.data;
    },
  });
}

export function useActualizarApariencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (colores) => {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/apariencia`, { colores }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.msg || 'Error al actualizar la apariencia');
    },
    onSuccess: () => {
      toast.success('Apariencia actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: ['aparienciaSistema'] });
    },
  });
}

export function useSubirLogoInstitucional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logo) => {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', logo);

      const res = await axios.post(`${API_BASE_URL}/api/apariencia/logo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.msg || 'Error al subir el logo institucional');
    },
    onSuccess: () => {
      toast.success('Logo institucional actualizado');
      queryClient.invalidateQueries({ queryKey: ['aparienciaSistema'] });
    },
  });
}

export function useRestaurarAparienciaOficial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/apariencia/restaurar-oficial`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.msg || 'Error al restaurar la apariencia oficial');
    },
    onSuccess: () => {
      toast.success('Apariencia oficial restaurada');
      queryClient.invalidateQueries({ queryKey: ['aparienciaSistema'] });
    },
  });
}
