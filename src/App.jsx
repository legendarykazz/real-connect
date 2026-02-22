import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import BrowseLands from './pages/BrowseLands';
import PropertyDetails from './pages/PropertyDetails';
import ListProperty from './pages/ListProperty';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected route: redirects to /login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Wait for auth state to resolve
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen font-sans bg-brand-light selection:bg-brand-green selection:text-white">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<BrowseLands />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/list-property" element={<ListProperty />} />
              <Route path="/login" element={<Login />} />
              {/* Admin is now protected - only logged in users can access */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
