import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Hook para obter tabs visíveis baseado nas permissões do usuário
 */
export const useTabsVisiveis = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [tabsVisiveis, setTabsVisiveis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTabsVisiveis = async () => {
      try {
        setLoading(true);
        
        // Buscar a página atual
        const responsePagina = await api.get(`/paginas-config/verificar?rota=${encodeURIComponent(location.pathname)}`);
        const pagina = responsePagina.data.pagina;

        if (!pagina) {
          // Se não houver configuração, mostrar todas as tabs (comportamento padrão)
          setTabsVisiveis([]);
          setLoading(false);
          return;
        }

        // Buscar tabs da página
        const responseTabs = await api.get(`/paginas-tabs/pagina/${pagina.id}`);
        const todasTabs = responseTabs.data.tabs || [];

        // Determinar tipo de usuário
        const tipoUsuario = determinarTipoUsuario(user);

        // Filtrar tabs baseado nas permissões
        const tabsFiltradas = todasTabs.filter(tab => {
          if (!tab.ativo) return false;

          // Verificar permissões baseado no tipo de usuário
          switch (tipoUsuario) {
            case 'geral':
              return tab.visivel_geral === true;
            case 'visitante':
              return tab.visivel_visitantes === true;
            case 'lider_ministerio':
              return tab.visivel_lider_ministerio === true;
            case 'participa_ministerio':
              return tab.visivel_participa_ministerio === true;
            default:
              // Se não conseguir determinar, usar visivel_geral como fallback
              return tab.visivel_geral === true;
          }
        });

        setTabsVisiveis(tabsFiltradas);
      } catch (error) {
        console.error('Erro ao carregar tabs visíveis:', error);
        // Em caso de erro, mostrar todas as tabs (comportamento padrão)
        setTabsVisiveis([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      carregarTabsVisiveis();
    } else {
      setLoading(false);
    }
  }, [location.pathname, user]);

  return { tabsVisiveis, loading };
};

/**
 * Determina o tipo de usuário baseado nos dados do usuário
 * TODO: Implementar lógica real baseada no sistema de permissões
 */
function determinarTipoUsuario(user) {
  if (!user) return 'geral';

  // Por enquanto, vamos usar uma lógica simples
  // Você pode ajustar isso baseado na estrutura real do seu sistema
  
  // Se o usuário tem tipo_acesso, podemos usar isso
  if (user.tipoAcesso) {
    // Mapear tipos de acesso para tipos de usuário
    // Ajuste isso conforme sua estrutura real
    const tipoAcesso = user.tipoAcesso.toLowerCase();
    
    if (tipoAcesso.includes('lider') || tipoAcesso.includes('líder')) {
      return 'lider_ministerio';
    }
    if (tipoAcesso.includes('participa') || tipoAcesso.includes('participante')) {
      return 'participa_ministerio';
    }
    if (tipoAcesso.includes('visitante')) {
      return 'visitante';
    }
  }

  // Verificar se é visitante baseado em algum campo
  // Por enquanto, assumimos que todos são "geral" por padrão
  // Você pode adicionar lógica aqui para verificar se é visitante, líder, etc.
  
  return 'geral';
}
