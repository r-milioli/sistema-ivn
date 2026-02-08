import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Settings, 
  Handshake, 
  Wallet, 
  Music, 
  HeartHandshake, 
  Users, 
  Hammer, 
  Baby, 
  Sparkles, 
  Heart, 
  BookOpen, 
  Zap, 
  Video,
  Smile,
  Bike,
  Home,
  Crown,
  ChefHat,
  Radio,
  Globe,
  Shield,
  UserCircle,
  MessageCircle,
  Cross,
  GraduationCap,
  Coffee,
  UsersRound,
  Activity,
  User,
  UserRound,
  Calendar,
  Drama,
  Mic,
  HeartPulse,
  UserCog,
  Droplet,
  UserCheck,
  FileText,
  Server,
  ClipboardList
} from 'lucide-react';
import MainLayout from '../../components/Layout/MainLayout';
import './Dashboard.css';

// Mapeamento de ícones por nome
const iconMap = {
  Handshake, Wallet, Music, HeartHandshake, Users, Hammer, Baby, Sparkles,
  Heart, BookOpen, Zap, Video, Smile, Bike, Home, Crown, ChefHat, Radio,
  Globe, Shield, UserCircle, MessageCircle, Cross, GraduationCap, Coffee,
  UsersRound, Activity, User, UserRound, Calendar, Drama, Mic, HeartPulse,
  UserCog, Droplet, UserCheck, FileText, Server, ClipboardList, Settings
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paginasConfig, setPaginasConfig] = useState([]);
  const [loading, setLoading] = useState(true);

  const nomeExibicao = user?.nome?.trim() || 'Usuário';

  // Carregar configurações de páginas (recarregar quando user mudar)
  useEffect(() => {
    if (user) {
      loadPaginasConfig();
    }
  }, [user?.id]);

  const loadPaginasConfig = async () => {
    try {
      // Montar parâmetros do usuário para filtrar páginas
      const params = new URLSearchParams();
      if (user?.id) params.append('pessoaId', user.id);
      if (user?.tipo_acesso || user?.tipoAcesso) {
        params.append('tipoAcesso', user.tipo_acesso || user.tipoAcesso);
      }
      if (user?.estagio_atual || user?.estagioAtual) {
        params.append('estagioAtual', user.estagio_atual || user.estagioAtual);
      }

      // Usar endpoint que já filtra por permissões
      const response = await api.get(`/paginas-config/visiveis?${params.toString()}`);
      setPaginasConfig(response.data.paginas || []);
    } catch (error) {
      console.error('Erro ao carregar configurações de páginas:', error);
      // Em caso de erro, usar lista padrão
      setPaginasConfig([]);
    } finally {
      setLoading(false);
    }
  };

  // Cards padrão (fallback se não houver configurações)
  const dashboardCardsDefault = [
    { 
      icon: Handshake, 
      label: 'Recepção', 
      path: '/recepcao'
    },
    { 
      icon: Wallet, 
      label: 'Finanças', 
      path: '/financas'
    },
    { 
      icon: UserCog, 
      label: 'Gestão de Pessoas', 
      path: '/gestao-pessoas'
    },
    { 
      icon: Music, 
      label: 'Louvor', 
      path: '/louvor'
    },
    { 
      icon: HeartHandshake, 
      label: 'Ação Social', 
      path: '/acao-social'
    },
    { 
      icon: Users, 
      label: 'Integração', 
      path: '/integracao'
    },
    { 
      icon: Hammer, 
      label: 'Obreiros', 
      path: '/obreiros'
    },
    { 
      icon: Smile, 
      label: 'Adolescentes', 
      path: '/adolescentes'
    },
    { 
      icon: Sparkles, 
      label: 'Jovens', 
      path: '/jovens'
    },
    { 
      icon: Heart, 
      label: 'Casais', 
      path: '/casais'
    },
    { 
      icon: BookOpen, 
      label: 'Amós', 
      path: '/amos'
    },
    { 
      icon: Zap, 
      label: 'Radical', 
      path: '/radical'
    },
    { 
      icon: Video, 
      label: 'Mídia', 
      path: '/midia'
    },
    { 
      icon: Settings, 
      label: 'Configurações', 
      path: '/configuracoes'
    },
    { 
      icon: Baby, 
      label: 'Kids', 
      path: '/kids'
    },
    { 
      icon: Bike, 
      label: 'Pedal', 
      path: '/pedal'
    },
    { 
      icon: Home, 
      label: 'Visitação', 
      path: '/visitacao'
    },
    { 
      icon: Crown, 
      label: 'Melhor Idade', 
      path: '/melhor-idade'
    },
    { 
      icon: ChefHat, 
      label: 'Espaço Gourmet', 
      path: '/espaco-gourmet'
    },
    { 
      icon: Radio, 
      label: 'Som', 
      path: '/som'
    },
    { 
      icon: Globe, 
      label: 'Missões', 
      path: '/missoes'
    },
    { 
      icon: Shield, 
      label: 'Sentinelas', 
      path: '/sentinelas'
    },
    { 
      icon: UsersRound, 
      label: 'Acolhimento', 
      path: '/acolhimento'
    },
    { 
      icon: UserCircle, 
      label: 'Juniores', 
      path: '/juniores'
    },
    { 
      icon: Activity, 
      label: 'Dança', 
      path: '/danca'
    },
    { 
      icon: MessageCircle, 
      label: 'Intercessão', 
      path: '/intercessao'
    },
    { 
      icon: Cross, 
      label: 'Libertação', 
      path: '/libertacao'
    },
    { 
      icon: GraduationCap, 
      label: 'EDB', 
      path: '/edb'
    },
    { 
      icon: Coffee, 
      label: 'Café com Graça', 
      path: '/cafe-com-graca'
    },
    { 
      icon: User, 
      label: 'Homens', 
      path: '/homens'
    },
    { 
      icon: UserRound, 
      label: 'Mulheres', 
      path: '/mulheres'
    },
    { 
      icon: HeartPulse, 
      label: 'Jovem Casais', 
      path: '/jovem-casais'
    },
    { 
      icon: Calendar, 
      label: 'Eventos', 
      path: '/eventos'
    },
    { 
      icon: Drama, 
      label: 'Teatro', 
      path: '/teatro'
    },
    { 
      icon: Mic, 
      label: 'Coral', 
      path: '/coral'
    },
    { 
      icon: Droplet, 
      label: 'Batismo', 
      path: '/batismo'
    },
    { 
      icon: UserCheck, 
      label: 'Membresia', 
      path: '/membresia'
    },
    { 
      icon: FileText, 
      label: 'Relatório', 
      path: '/relatorio'
    },
    { 
      icon: Server, 
      label: 'Config System', 
      path: '/config-system'
    },
    { 
      icon: ClipboardList, 
      label: 'Ficha de Membros', 
      path: '/ficha-membros'
    },
  ];

  // Cards filtrados baseado nas configurações
  const dashboardCards = useMemo(() => {
    if (loading || paginasConfig.length === 0) {
      return dashboardCardsDefault;
    }

    // Criar mapa de configurações por rota
    const configMap = new Map();
    paginasConfig.forEach(pagina => {
      configMap.set(pagina.rota, pagina);
    });

    // O backend já filtrou por permissões e card_visivel
    // Apenas mapear para os cards padrão
    return dashboardCardsDefault
      .filter(card => {
        // Mostrar apenas se a página está na lista retornada pelo backend
        return configMap.has(card.path);
      })
      .map(card => {
        const config = configMap.get(card.path);
        if (config && config.icone) {
          const IconComponent = iconMap[config.icone];
          if (IconComponent) {
            return { ...card, icon: IconComponent };
          }
        }
        return card;
      })
      .sort((a, b) => {
        const configA = configMap.get(a.path);
        const configB = configMap.get(b.path);
        const ordemA = configA?.ordem ?? 999;
        const ordemB = configB?.ordem ?? 999;
        return ordemA - ordemB;
      });
  }, [paginasConfig, loading]);

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div className="dashboard-welcome-logo">
              <img
                src="/images/logo.png"
                alt="Sistema IVN"
                className="dashboard-welcome-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
                onLoad={(e) => {
                  e.target.style.display = 'block';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'none';
                }}
              />
              <span className="dashboard-welcome-logo-fallback">IVN</span>
            </div>
            <div className="dashboard-welcome-text">
              <h2 className="dashboard-welcome-greeting">
                Graça e Paz, {nomeExibicao}!
              </h2>
              <p className="dashboard-welcome-sub">Bem-vindo(a) ao sistema. Escolha um módulo abaixo para começar.</p>
            </div>
          </div>
          <div className="dashboard-cards-container">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="dashboard-card"
                  onClick={() => handleCardClick(card.path)}
                >
                  <div className="dashboard-card-icon">
                    <Icon className="icon" />
                  </div>
                  <div className="dashboard-card-label">{card.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default Dashboard;
