import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AppRoutes from './AppRoutes';
import { Toaster } from 'sonner';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
