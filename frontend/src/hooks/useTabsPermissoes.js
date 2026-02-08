import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Hook para obter tabs visíveis baseado nas permissões do usuário
 * @param {Array} tabsPadrao - Array de tabs padrão caso não haja configuração
 * @returns {Object} { tabsVisiveis, loading }
 */
export const useTabsPermissoes = (tabsPadrao = []) => {
  const location = useLocation();
  const { user } = useAuth();
  const [tabsVisiveis, setTabsVisiveis] = useState(tabsPadrao);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTabsVisiveis = async () => {
      try {
        setLoading(true);
        
        // Buscar a página atual
        const responsePagina = await api.get(`/paginas-config/verificar?rota=${encodeURIComponent(location.pathname)}`);
        const pagina = responsePagina.data.pagina;

        if (!pagina) {
          // Se não houver configuração, usar tabs padrão
          setTabsVisiveis(tabsPadrao);
          setLoading(false);
          return;
        }

        // Determinar tipo de usuário
        const tipoUsuario = determinarTipoUsuario(user);
        console.log('[useTabsPermissoes] Tipo de usuário determinado:', tipoUsuario);
        console.log('[useTabsPermissoes] Buscando tabs para página:', pagina.id);

        // Buscar tabs visíveis (enviar também pessoaId para verificação de ministério)
        const pessoaId = user?.id;
        const url = `/paginas-tabs/pagina/${pagina.id}/visiveis?tipoUsuario=${tipoUsuario}${pessoaId ? `&pessoaId=${pessoaId}` : ''}`;
        console.log('[useTabsPermissoes] URL da requisição:', url);
        const responseTabs = await api.get(url);
        const tabsPermitidas = responseTabs.data.tabs || [];
        console.log('[useTabsPermissoes] Tabs permitidas encontradas:', tabsPermitidas);

        // Página tem configuração: respeitar exatamente o que a API retornou.
        // Se retornou 0 tabs = usuário não tem permissão para nenhuma tab (não mostrar todas).
        if (tabsPermitidas.length > 0) {
          const valoresPermitidos = tabsPermitidas.map(t => t.valor);
          const tabsFiltradas = tabsPadrao.filter(tab =>
            valoresPermitidos.includes(tab.value)
          );
          setTabsVisiveis(tabsFiltradas);
        } else {
          // Resposta vazia com página configurada = sem permissão para nenhuma tab
          setTabsVisiveis([]);
        }
      } catch (error) {
        console.error('Erro ao carregar tabs visíveis:', error);
        // Em caso de erro, usar tabs padrão
        setTabsVisiveis(tabsPadrao);
      } finally {
        setLoading(false);
      }
    };

    if (user && tabsPadrao.length > 0) {
      carregarTabsVisiveis();
    } else {
      setTabsVisiveis(tabsPadrao);
      setLoading(false);
    }
  }, [location.pathname, user?.id, user?.tipo_acesso, user?.tipoAcesso, user?.estagio_atual, user?.estagioAtual, JSON.stringify(tabsPadrao)]);

  return { tabsVisiveis, loading };
};

/**
 * Determina apenas se o usuário é "visitante" para fins de tabs.
 * Líder/Participante do ministério são decididos no BACKEND pelo ministério da PÁGINA
 * (não pela função/cargo do usuário), usando pessoaId.
 */
function determinarTipoUsuario(user) {
  if (!user) return 'geral';

  // Só enviamos 'visitante' quando for claramente visitante; caso contrário 'geral'.
  // O backend usa pessoaId para ver se a pessoa é líder/participante DO MINISTÉRIO DA PÁGINA.
  const estagioAtual = user.estagioAtual || user.estagio_atual;
  if (estagioAtual) {
    const estagio = String(estagioAtual).toLowerCase().trim();
    if (estagio.includes('visitante')) return 'visitante';
  }

  return 'geral';
}
