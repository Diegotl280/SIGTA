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
        const res = await axios.post(`${API_BASE_URL}/api/auth/register`, user, {
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
        onSuccess: (data) => {
            console.log(data); //al hacer el despliege, se debe eliminar esta linea
            toast.success("Empresa registrada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['users'] }); // envia este usuario a la cache
        },
    }); //Fin de return
}//Fin de useCreateUser

/**
 * Hook para actualizar la información del perfil del usuario 
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    //Funcion para actualizar un usuario
    const updateUserRequest = async (formData) => {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_BASE_URL}/api/user`, formData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }//Fin de updateUserRequest

    return useMutation({
        mutationFn: updateUserRequest,
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.msg || err.toString() || "Error al actualizar el usuario");
        }, 
        onSuccess: (data) => {
            console.log(data);
            toast.success("Perfil actualizado exitosamente");
            queryClient.invalidateQueries({ queryKey: ['user'] });
        }
    }); //Fin de return
}//Fin de useUpdateUser

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
            toast.error(err.response?.data?.msg || err.toString() || "Error al eliminar la empresa");
        },
        onSuccess: (data) => {
            toast.success("Empresa eliminada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
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
        onSuccess: (data) => {
            toast.success("Empresa actualizada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['empresas'] });
        }
    });
}
