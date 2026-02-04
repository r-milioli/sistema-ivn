import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut, Search, User, Home, Users, DollarSign, Calendar, X } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '../ui/sidebar';
import '../Layout/MainLayout.css';

const SidebarCloseButton = () => {
  const { setOpen } = useSidebar();
  
  return (
    <div className="sidebar-close-button-wrapper">
      <button
        className="sidebar-close-button"
        onClick={() => setOpen(false)}
        type="button"
        aria-label="Fechar sidebar"
      >
        <X className="sidebar-close-icon" />
      </button>
    </div>
  );
};

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Membros', path: '/membros' },
    { icon: DollarSign, label: 'Finanças', path: '/financas' },
    { icon: Calendar, label: 'Eventos', path: '/eventos' },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <SidebarTrigger className="menu-button" />
              <Link to="/dashboard" className="header-logo">
                <h1>Sistema IVN</h1>
              </Link>
            </div>
            
            <div className="header-right">
              <button className="icon-button search-button" type="button">
                <Search className="header-icon" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="icon-button user-button" type="button">
                    <User className="header-icon" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dropdown-content">
                  <div className="user-info">
                    <div className="user-name-header">{user?.nome || 'Usuário'}</div>
                    <div className="user-email-header">{user?.email || ''}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="dropdown-item"
                    onClick={() => navigate('/configuracoes')}
                  >
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

        <div style={{ display: 'flex', width: '100%' }}>
          <Sidebar>
            <SidebarContent>
              <SidebarCloseButton />
              <SidebarGroup>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton asChild isActive={item.path === location.pathname}>
                            <Link to={item.path}>
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
