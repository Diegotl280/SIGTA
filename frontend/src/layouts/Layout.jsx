import { useAuth } from '../auth/useAuth';
import HeaderAdmin from '../components/HeaderAdmin';
import HeaderUser from '../components/HeaderUser';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  return (
    <div className="layout-container">
      {isAdmin ? <HeaderAdmin /> : <HeaderUser />}
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
