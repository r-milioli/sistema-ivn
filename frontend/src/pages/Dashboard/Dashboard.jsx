import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const nomeExibicao = user?.nome?.trim() || 'Usuário';

  const dashboardCards = [
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
