import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Hook para obtener los expedientes del usuario autenticado (Empresa).
 */
export function useGetMisExpedientes() {
    const getMisExpedientesRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/expedientes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useQuery({
        queryKey: ['misExpedientes'],
        queryFn: getMisExpedientesRequest,
    });
}

/**
 * Hook para crear un nuevo expediente (Iniciar un trámite).
 */
export function useCrearExpediente() {
    const queryClient = useQueryClient();

    const crearExpedienteRequest = async (tipoTramite) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.post(`${API_BASE_URL}/api/expedientes`, { tipo: tipoTramite }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: crearExpedienteRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al crear el expediente");
        },
        onSuccess: (data) => {
            toast.success("Trámite iniciado");
            queryClient.invalidateQueries({ queryKey: ['misExpedientes'] });
        }
    });
}

/**
 * Hook para enviar el expediente a revisión (cambiar estado a 'enviado').
 */
export function useEnviarExpediente() {
    const queryClient = useQueryClient();

    const enviarExpedienteRequest = async (expedienteId) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.patch(`${API_BASE_URL}/api/expedientes/${expedienteId}/enviar`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: enviarExpedienteRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al enviar el expediente");
        },
        onSuccess: (data) => {
            toast.success("Trámite enviado a revisión exitosamente");
            queryClient.invalidateQueries({ queryKey: ['misExpedientes'] });
        }
    });
}

/**
 * Hook para cambiar el estado de un expediente (Solo Administrador)
 */
export function useCambiarEstadoExpediente() {
    const queryClient = useQueryClient();

    const cambiarEstadoRequest = async ({ id, estado, observacionesGenerales }) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.patch(`${API_BASE_URL}/api/expedientes/${id}/estado`, 
        { estado, observacionesGenerales }, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: cambiarEstadoRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al cambiar el estado");
        },
        onSuccess: (data) => {
            toast.success("Estado del trámite actualizado");
            queryClient.invalidateQueries({ queryKey: ['expedientesEmpresa'] });
            queryClient.invalidateQueries({ queryKey: ['misExpedientes'] });
        }
    });
}
