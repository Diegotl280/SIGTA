import { useAuth } from '../auth/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  if (!isAdmin) return null;

  return (
    <div className="search-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Busqueda" />
      </div>
      <button className="search-btn">Buscar</button>
    </div>
  );
};

export default Dashboard;
