import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AppearanceProvider } from './appearance/AppearanceProvider';
import AppRoutes from './AppRoutes';
import './index.css';

function App() {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </AppearanceProvider>
  );
}

export default App;
