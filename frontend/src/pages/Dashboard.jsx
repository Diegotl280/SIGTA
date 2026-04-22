import { useAuth } from '../context/AuthContext';
import HeaderAdmin from '../components/HeaderAdmin';
import HeaderUser from '../components/HeaderUser';
import Footer from '../components/Footer';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  return (
    <div className="layout-container">
      {/* HEADER */}
      {isAdmin ? <HeaderAdmin /> : <HeaderUser />}

      {/* MAIN CONTENT */}
      <main className="main-content">
        {isAdmin && (
          <div className="search-container">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Busqueda" />
            </div>
            <button className="search-btn">Buscar</button>
          </div>
        )}
      </main>

      {/* FOOTER WIDGET */}
      <Footer />
    </div>
  );
};

export default Dashboard;
