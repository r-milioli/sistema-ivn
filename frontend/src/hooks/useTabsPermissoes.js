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

        // Se houver tabs configuradas, usar apenas as permitidas
        if (tabsPermitidas.length > 0) {
          // Filtrar tabs padrão baseado nas tabs permitidas
          const valoresPermitidos = tabsPermitidas.map(t => t.valor);
          const tabsFiltradas = tabsPadrao.filter(tab => 
            valoresPermitidos.includes(tab.value)
          );
          setTabsVisiveis(tabsFiltradas);
        } else {
          // Se não houver configuração de permissões, usar todas as tabs padrão
          setTabsVisiveis(tabsPadrao);
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
 * Determina o tipo de usuário baseado nos dados do usuário
 */
function determinarTipoUsuario(user) {
  if (!user) {
    console.log('[useTabsPermissoes] Usuário não encontrado, retornando "geral"');
    return 'geral';
  }

  console.log('[useTabsPermissoes] Dados do usuário:', {
    id: user.id,
    tipo_acesso: user.tipo_acesso,
    tipoAcesso: user.tipoAcesso,
    estagio_atual: user.estagio_atual,
    estagioAtual: user.estagioAtual
  });

  // Verificar tipo_acesso do usuário (pode ser tipo_acesso ou tipoAcesso)
  const tipoAcesso = user.tipo_acesso || user.tipoAcesso;
  
  if (tipoAcesso) {
    const tipoAcessoLower = String(tipoAcesso).toLowerCase().trim();
    console.log('[useTabsPermissoes] Tipo de acesso encontrado:', tipoAcessoLower);
    
    // Mapear tipos de acesso do enum tipo_acesso_enum
    // 'Sem Acesso', 'Usuario', 'Lider', 'Admin', 'SuperAdmin'
    // O valor no banco é 'Lider' (com L maiúsculo)
    if (tipoAcessoLower === 'lider' || tipoAcessoLower === 'líder' || tipoAcessoLower.includes('lider')) {
      console.log('[useTabsPermissoes] Usuário identificado como LÍDER (tipo_acesso)');
      return 'lider_ministerio';
    }
    // Para 'Usuario', 'Admin', 'SuperAdmin', verificar se participa de ministério
    // Por enquanto, assumimos que Admin e SuperAdmin têm acesso geral
    if (tipoAcessoLower === 'admin' || tipoAcessoLower === 'superadmin') {
      console.log('[useTabsPermissoes] Usuário identificado como ADMIN/SUPERADMIN');
      return 'geral'; // Admins veem tudo
    }
    if (tipoAcessoLower === 'usuario' || tipoAcessoLower === 'usuário') {
      console.log('[useTabsPermissoes] Usuário identificado como USUÁRIO');
      // Verificar se é participante de ministério (precisa verificar na tabela pessoa_ministerios)
      // Por enquanto, retornar 'geral'
      return 'geral';
    }
  }

  // Verificar estágio espiritual (se disponível)
  const estagioAtual = user.estagioAtual || user.estagio_atual;
  if (estagioAtual) {
    const estagio = String(estagioAtual).toLowerCase().trim();
    console.log('[useTabsPermissoes] Estágio atual encontrado:', estagio);
    
    if (estagio.includes('líder') || estagio.includes('lider')) {
      console.log('[useTabsPermissoes] Usuário identificado como LÍDER (por estágio)');
      return 'lider_ministerio';
    }
    if (estagio.includes('participante') || estagio.includes('participa')) {
      console.log('[useTabsPermissoes] Usuário identificado como PARTICIPANTE');
      return 'participa_ministerio';
    }
    if (estagio.includes('visitante')) {
      console.log('[useTabsPermissoes] Usuário identificado como VISITANTE');
      return 'visitante';
    }
  }

  // Por padrão, retornar 'geral' (acesso completo)
  console.log('[useTabsPermissoes] Usuário identificado como GERAL (padrão)');
  return 'geral';
}
