import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [verificandoVisibilidade, setVerificandoVisibilidade] = useState(true);
  const [paginaVisivel, setPaginaVisivel] = useState(true);

  // Verificar visibilidade da página
  useEffect(() => {
    const verificarVisibilidade = async () => {
      // Dashboard sempre é acessível
      if (location.pathname === '/dashboard') {
        setVerificandoVisibilidade(false);
        setPaginaVisivel(true);
        return;
      }

      try {
        const rota = location.pathname;
        const response = await api.get(`/paginas-config/verificar?rota=${encodeURIComponent(rota)}`);
        setPaginaVisivel(response.data.visivel);
      } catch (error) {
        console.error('Erro ao verificar visibilidade da página:', error);
        // Em caso de erro, permitir acesso (compatibilidade)
        setPaginaVisivel(true);
      } finally {
        setVerificandoVisibilidade(false);
      }
    };

    if (isAuthenticated && !loading) {
      verificarVisibilidade();
    }
  }, [location.pathname, isAuthenticated, loading]);

  if (loading || verificandoVisibilidade) {
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se a página não estiver visível, redirecionar para o dashboard
  if (!paginaVisivel) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
