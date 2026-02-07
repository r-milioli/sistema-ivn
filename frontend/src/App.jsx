import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Recepcao from './pages/Recepcao/Recepcao';
import Financas from './pages/Financas/Financas';
import GestaoPessoas from './pages/GestaoPessoas/GestaoPessoas';
import Configuracoes from './pages/Configuracoes/Configuracoes';
import Integracao from './pages/Integracao/Integracao';
import Eventos from './pages/Eventos/Eventos';
import Membresia from './pages/Membresia/Membresia';
import Batismo from './pages/Batismo/Batismo';
import Relatorio from './pages/Relatorio/Relatorio';
import ConfigSystem from './pages/ConfigSystem/ConfigSystem';
import FichaMembros from './pages/FichaMembros/FichaMembros';

// Componente para redirecionar usuários autenticados
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recepcao"
        element={
          <ProtectedRoute>
            <Recepcao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financas"
        element={
          <ProtectedRoute>
            <Financas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestao-pessoas"
        element={
          <ProtectedRoute>
            <GestaoPessoas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracao"
        element={
          <ProtectedRoute>
            <Integracao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eventos"
        element={
          <ProtectedRoute>
            <Eventos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/membresia"
        element={
          <ProtectedRoute>
            <Membresia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/batismo"
        element={
          <ProtectedRoute>
            <Batismo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorio"
        element={
          <ProtectedRoute>
            <Relatorio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/config-system"
        element={
          <ProtectedRoute>
            <ConfigSystem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ficha-membros"
        element={
          <ProtectedRoute>
            <FichaMembros />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
