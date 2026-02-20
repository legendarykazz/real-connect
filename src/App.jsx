import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BrowseLands from './pages/BrowseLands';
import PropertyDetails from './pages/PropertyDetails';
import ListProperty from './pages/ListProperty';
import AdminDashboard from './pages/AdminDashboard';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen font-sans bg-brand-light selection:bg-brand-green selection:text-white">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<BrowseLands />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/list-property" element={<ListProperty />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
