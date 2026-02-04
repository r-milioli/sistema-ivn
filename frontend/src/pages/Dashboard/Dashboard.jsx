import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Handshake, Wallet } from 'lucide-react';
import MainLayout from '../../components/Layout/MainLayout';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    { 
      icon: Handshake, 
      label: 'Recepção', 
      path: '/recepcao',
      color: '#8b5cf6'
    },
    { 
      icon: Wallet, 
      label: 'Finanças', 
      path: '/financas',
      color: '#10b981'
    },
    { 
      icon: Settings, 
      label: 'Configurações', 
      path: '/configuracoes',
      color: '#6366f1'
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-cards-container">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="dashboard-card"
                  onClick={() => handleCardClick(card.path)}
                >
                  <div className="dashboard-card-icon" style={{ color: card.color }}>
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
