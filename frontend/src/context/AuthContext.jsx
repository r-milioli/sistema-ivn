import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { saveAuthData, clearAuthData, getUser, isAuthenticated, getToken } from '../utils/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo ao carregar e obter dados completos (foto, etc.)
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const response = await api.get('/auth/me');
          const fullUser = response.data?.user;
          if (fullUser) {
            setUser(fullUser);
            const token = getToken();
            if (token) saveAuthData(token, fullUser);
          } else {
            setUser(getUser());
          }
        } catch (error) {
          // Token inválido, limpar dados
          clearAuthData();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, user: userData } = response.data;
      
      saveAuthData(token, userData);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer login',
      };
    }
  };

  const register = async (nome, email, senha) => {
    try {
      const response = await api.post('/auth/register', { nome, email, senha });
      const { token, user: userData } = response.data;
      
      saveAuthData(token, userData);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar conta',
      };
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao solicitar recuperação',
      };
    }
  };

  const resetPassword = async (token, senha) => {
    try {
      await api.post('/auth/reset-password', { token, senha });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao redefinir senha',
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      saveAuthData(getToken(), userData);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar dados do usuário',
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
