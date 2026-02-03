import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Sistema IVN</h1>
          <div className="header-actions">
            <span className="user-name">Olá, {user?.nome}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="settings-button">
                  <Settings className="settings-icon" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dropdown-content">
                <DropdownMenuItem className="dropdown-item">
                  <Settings className="dropdown-icon" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="dropdown-item logout-item">
                  <LogOut className="dropdown-icon" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <h2>Dashboard</h2>
          <p>Esta é uma página em branco. Conteúdo será adicionado posteriormente.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
