import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import api from '../../services/api';

/**
 * Componente Tabs que filtra tabs baseado nas permissões do usuário
 */
const TabsComPermissao = ({ 
  defaultValue, 
  className, 
  children, 
  tabsConfig = [] // Array de { value, label, icon, content }
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const [tabsVisiveis, setTabsVisiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaId, setPaginaId] = useState(null);

  useEffect(() => {
    const carregarPermissoes = async () => {
      try {
        setLoading(true);
        
        // Buscar a página atual
        const responsePagina = await api.get(`/paginas-config/verificar?rota=${encodeURIComponent(location.pathname)}`);
        const pagina = responsePagina.data.pagina;

        if (!pagina) {
          // Se não houver configuração, mostrar todas as tabs
          setTabsVisiveis(tabsConfig);
          setLoading(false);
          return;
        }

        setPaginaId(pagina.id);

        // Buscar tabs da página
        const responseTabs = await api.get(`/paginas-tabs/pagina/${pagina.id}`);
        const todasTabs = responseTabs.data.tabs || [];

        // Determinar tipo de usuário
        const tipoUsuario = determinarTipoUsuario(user);

        // Criar mapa de permissões por valor da tab
        const permissoesMap = {};
        todasTabs.forEach(tab => {
          permissoesMap[tab.valor] = {
            visivel_geral: tab.visivel_geral,
            visivel_visitantes: tab.visivel_visitantes,
            visivel_lider_ministerio: tab.visivel_lider_ministerio,
            visivel_participa_ministerio: tab.visivel_participa_ministerio,
            ativo: tab.ativo
          };
        });

        // Filtrar tabs baseado nas permissões
        const tabsFiltradas = tabsConfig.filter(tab => {
          const permissao = permissoesMap[tab.value];
          
          // Se não houver configuração para esta tab, mostrar por padrão
          if (!permissao) return true;
          
          // Se tab não está ativa, não mostrar
          if (!permissao.ativo) return false;

          // Verificar permissões baseado no tipo de usuário
          switch (tipoUsuario) {
            case 'geral':
              return permissao.visivel_geral === true;
            case 'visitante':
              return permissao.visivel_visitantes === true;
            case 'lider_ministerio':
              return permissao.visivel_lider_ministerio === true;
            case 'participa_ministerio':
              return permissao.visivel_participa_ministerio === true;
            default:
              return permissao.visivel_geral === true;
          }
        });

        setTabsVisiveis(tabsFiltradas);
      } catch (error) {
        console.error('Erro ao carregar permissões de tabs:', error);
        // Em caso de erro, mostrar todas as tabs
        setTabsVisiveis(tabsConfig);
      } finally {
        setLoading(false);
      }
    };

    if (user && tabsConfig.length > 0) {
      carregarPermissoes();
    } else {
      setTabsVisiveis(tabsConfig);
      setLoading(false);
    }
  }, [location.pathname, user, tabsConfig]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não houver tabs visíveis, não renderizar nada
  if (tabsVisiveis.length === 0) {
    return null;
  }

  // Renderizar apenas as tabs visíveis
  return (
    <Tabs defaultValue={defaultValue || tabsVisiveis[0]?.value} className={className}>
      {children}
    </Tabs>
  );
};

/**
 * Determina o tipo de usuário baseado nos dados do usuário
 */
function determinarTipoUsuario(user) {
  if (!user) return 'geral';

  // Se o usuário tem tipo_acesso, podemos usar isso
  if (user.tipoAcesso) {
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

  // Por padrão, retornar 'geral'
  return 'geral';
}

export default TabsComPermissao;
