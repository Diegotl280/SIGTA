const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

/**
 * Hook invocable al crear un usuario/empresa.
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    //Funcion para crear un usuario en el backend
    const createUserRequest = async (user) => {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_BASE_URL}/api/auth/empresas`, user, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }//Fin de createUserRequest

    return useMutation({
        mutationFn: createUserRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al crear el usuario");
        },
        onSuccess: () => {
            toast.success("Empresa registrada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
        },
    }); //Fin de return
}//Fin de useCreateUser

/**
 * Hook para obtener la información de perfil existente del usuario autenticado.
 */
export function useGetUser() {
    //Funcion para obtener un usuario
    const getUserRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }//Fin de getUserRequest
    
    return useQuery({
        queryKey: ['user'],
        queryFn: getUserRequest,
        retry: false,
    }); //Fin del return
}//Fin de useGetUser

/**
 * Hook para obtener la lista de todas las empresas (usuarios)
 */
export function useGetEmpresas() {
    const getEmpresasRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/auth/empresas`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }
    
    return useQuery({
        queryKey: ['empresas'],
        queryFn: getEmpresasRequest,
    });
}

export function useGetEmpresasArchivadas() {
    const getEmpresasArchivadasRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/auth/empresas/archivadas`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useQuery({
        queryKey: ['empresasArchivadas'],
        queryFn: getEmpresasArchivadasRequest,
    });
}

/**
 * Hook para deshabilitar una empresa (eliminación lógica)
 */
export function useDeshabilitarEmpresa() {
    const queryClient = useQueryClient();

    const deshabilitarRequest = async (id) => {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_BASE_URL}/api/auth/empresas/${id}/deshabilitar`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: deshabilitarRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al archivar la empresa");
        },
        onSuccess: () => {
            toast.success("Empresa archivada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
            queryClient.invalidateQueries({ queryKey: ['empresasArchivadas'] });
        }
    });
}

export function useRestaurarEmpresa() {
    const queryClient = useQueryClient();

    const restaurarRequest = async (id) => {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_BASE_URL}/api/auth/empresas/${id}/restaurar`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: restaurarRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al restaurar la empresa");
        },
        onSuccess: () => {
            toast.success("Empresa restaurada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
            queryClient.invalidateQueries({ queryKey: ['empresasArchivadas'] });
        }
    });
}

export function useEliminarEmpresaDefinitivamente() {
    const queryClient = useQueryClient();

    const eliminarRequest = async (id) => {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`${API_BASE_URL}/api/auth/empresas/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: eliminarRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al eliminar definitivamente la empresa");
        },
        onSuccess: () => {
            toast.success("Empresa eliminada definitivamente");
            queryClient.invalidateQueries({ queryKey: ['empresasArchivadas'] });
        }
    });
}

/**
 * Hook para actualizar una empresa por el administrador
 */
export function useUpdateEmpresaAdmin() {
    const queryClient = useQueryClient();

    const updateRequest = async ({ id, data }) => {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_BASE_URL}/api/auth/empresas/${id}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: updateRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al actualizar la empresa");
        },
        onSuccess: () => {
            toast.success("Empresa actualizada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
        }
    });
}

/**
 * Hook para obtener los expedientes de una empresa específica (Solo Administrador)
 */
export function useGetExpedientesByEmpresa(empresaId) {
    const getExpedientesRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/expedientes/usuario/${empresaId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useQuery({
        queryKey: ['expedientesEmpresa', empresaId],
        queryFn: getExpedientesRequest,
        enabled: !!empresaId, // Solo se ejecuta si hay un empresaId
    });
}

/**
 * Hook para obtener la configuración de trámites (nombres, requisitos, etc.)
 */
export function useGetConfigTramites() {
    const getConfigRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/config-tramites`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useQuery({
        queryKey: ['configTramites'],
        queryFn: getConfigRequest,
    });
}

export function useGetConfigTramitesArchivados() {
    const getConfigArchivadosRequest = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token available");

        const res = await axios.get(`${API_BASE_URL}/api/config-tramites/archivados`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useQuery({
        queryKey: ['configTramitesArchivados'],
        queryFn: getConfigArchivadosRequest,
    });
}

export function useArchivarConfigTramite() {
    const queryClient = useQueryClient();

    const archivarRequest = async (id) => {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_BASE_URL}/api/config-tramites/${id}/archivar`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: archivarRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al archivar el trámite");
        },
        onSuccess: () => {
            toast.success("Trámite archivado exitosamente");
            queryClient.invalidateQueries({ queryKey: ['configTramites'] });
            queryClient.invalidateQueries({ queryKey: ['configTramitesArchivados'] });
        }
    });
}

export function useRestaurarConfigTramite() {
    const queryClient = useQueryClient();

    const restaurarRequest = async (id) => {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_BASE_URL}/api/config-tramites/${id}/restaurar`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: restaurarRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al restaurar el trámite");
        },
        onSuccess: () => {
            toast.success("Trámite restaurado exitosamente");
            queryClient.invalidateQueries({ queryKey: ['configTramites'] });
            queryClient.invalidateQueries({ queryKey: ['configTramitesArchivados'] });
        }
    });
}

export function useEliminarConfigTramiteDefinitivamente() {
    const queryClient = useQueryClient();

    const eliminarRequest = async (id) => {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`${API_BASE_URL}/api/config-tramites/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }

    return useMutation({
        mutationFn: eliminarRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al eliminar definitivamente el trámite");
        },
        onSuccess: () => {
            toast.success("Trámite eliminado definitivamente");
            queryClient.invalidateQueries({ queryKey: ['configTramitesArchivados'] });
        }
    });
}
