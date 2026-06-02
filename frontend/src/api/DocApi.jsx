import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Hook para obtener los documentos de un expediente específico.
 * Retorna tanto el checklist como los documentos subidos.
 */
export function useGetDocumentosByExpediente(expedienteId) {
    const getDocumentosRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/expedientes/${expedienteId}/documentos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useQuery({
        queryKey: ['documentosExpediente', expedienteId],
        queryFn: getDocumentosRequest,
        enabled: !!expedienteId, // Solo se ejecuta si hay un expedienteId
    });
}

/**
 * Hook para subir un documento PDF asociado a un expediente y requisito.
 */
export function useSubirDocumento() {
    const queryClient = useQueryClient();

    const subirDocumentoRequest = async ({ expedienteId, tipoRequisito, archivo }) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        // Al subir archivos (multipart/form-data) usamos FormData
        const formData = new FormData();
        formData.append('tipoRequisito', tipoRequisito);
        formData.append('archivo', archivo);

        const res = await axios.post(`${API_BASE_URL}/api/expedientes/${expedienteId}/documentos`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: subirDocumentoRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al subir el documento");
        },
        onSuccess: (data, variables) => {
            toast.success("Documento subido exitosamente");
            queryClient.invalidateQueries({ queryKey: ['documentosExpediente', variables.expedienteId] });
        }
    });
}

/**
 * Hook para validar o rechazar un documento específico (Administrador)
 */
export function useValidarDocumento() {
    const queryClient = useQueryClient();

    const validarDocumentoRequest = async ({ expedienteId, documentoId, estado, observacion }) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.patch(`${API_BASE_URL}/api/expedientes/${expedienteId}/documentos/${documentoId}/validar`, 
        { estado, observacion },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: validarDocumentoRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al validar el documento");
        },
        onSuccess: (data, variables) => {
            toast.success(data?.msg || "Estado del documento actualizado");
            queryClient.invalidateQueries({ queryKey: ['documentosExpediente', variables.expedienteId] });
            // Al validar un documento, puede cambiar el estado del expediente general
            queryClient.invalidateQueries({ queryKey: ['expedientesEmpresa'] });
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
        }
    });
}
