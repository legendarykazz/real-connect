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

// -------------------------------------------------------
// SET YOUR ADMIN EMAIL HERE — only this email can access /admin
// -------------------------------------------------------
const ADMIN_EMAIL = 'amjustsam28@gmail.com';

// Protected route: only logged-in users can access
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Admin-only route: must be logged in AND have the admin email
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== ADMIN_EMAIL) {
    // Logged in but not the admin — show access denied
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 font-sans">
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md text-center border border-gray-100">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-extrabold text-brand-dark mb-3">Access Denied</h1>
          <p className="text-gray-500 mb-8">This page is restricted to RealConnect administrators only. If you believe this is an error, please contact support.</p>
          <a href="/" className="inline-block bg-brand-green text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
            Go Back Home
          </a>
        </div>
      </div>
    );
  }
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
              {/* Admin: only the owner email can access */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
