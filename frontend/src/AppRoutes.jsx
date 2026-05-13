import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmpresasAdmin from './pages/EmpresasAdmin';
import AgregarEmpresa from './pages/AgregarEmpresa';
import NotificacionesAdmin from './pages/NotificacionesAdmin';
import TramitesAdmin from './pages/TramitesAdmin';
import NotifiUsuario from './pages/NotifiUsuario';
import TramitesUser from './pages/TramitesUser';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './layouts/Layout';
import ConfiguracionAdmin from './pages/ConfiguracionAdmin';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">Cargando...</div>;
  if (user?.role === 'administrador') return <Navigate to="/admin" />;
  return <Navigate to="/notificaciones" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRedirect />} />

        {/* Admin */}
        <Route path="admin" element={<ProtectedRoute allowedRole="administrador"><Dashboard /></ProtectedRoute>} />
        <Route path="admin/empresas" element={<ProtectedRoute allowedRole="administrador"><EmpresasAdmin /></ProtectedRoute>} />
        <Route path="admin/empresas/agregar" element={<ProtectedRoute allowedRole="administrador"><AgregarEmpresa /></ProtectedRoute>} />
        <Route path="admin/tramites" element={<ProtectedRoute allowedRole="administrador"><TramitesAdmin /></ProtectedRoute>} />
        <Route path="admin/notificaciones" element={<ProtectedRoute allowedRole="administrador"><NotificacionesAdmin /></ProtectedRoute>} />
        <Route path="admin/configuracion" element={<ProtectedRoute allowedRole="administrador"><ConfiguracionAdmin /></ProtectedRoute>} />
        
        {/* Usuario */}
        <Route path="notificaciones" element={<ProtectedRoute allowedRole="usuario"><NotifiUsuario /></ProtectedRoute>} />
        <Route path="tramites" element={<ProtectedRoute allowedRole="usuario"><TramitesUser /></ProtectedRoute>} />

        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;