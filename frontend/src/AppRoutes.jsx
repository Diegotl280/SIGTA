import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotifiUsuario from './pages/NotifiUsuario';
import TramitesUser from './pages/TramitesUser';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './layouts/Layout';

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
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRedirect />} />

        {/* Rutas de Administrador */}
        <Route path="admin" element={
          <ProtectedRoute allowedRole="administrador">
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Rutas de Usuario */}
        <Route path="notificaciones" element={
          <ProtectedRoute allowedRole="usuario">
            <NotifiUsuario />
          </ProtectedRoute>
        } />
        <Route path="tramites" element={
          <ProtectedRoute allowedRole="usuario">
            <TramitesUser />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
