import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="loader">Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'administrador' ? '/admin' : '/notificaciones'} />;
  }

  return children;
};

export default ProtectedRoute;
