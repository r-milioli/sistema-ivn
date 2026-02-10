import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut, Bell, Cake, User, LayoutDashboard, ClipboardList, Calendar, X } from 'lucide-react';
import { ModeToggle } from '../Theme/ModeToggle';
import { useSidebar } from '../ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '../ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
    <button
      className="sidebar-close-btn"
      onClick={() => setOpen(false)}
      type="button"
      aria-label="Fechar menu"
    >
      <X className="sidebar-close-btn-icon" />
    </button>
  );
};

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Ficha de Membros', path: '/ficha-membros' },
    { icon: Calendar, label: 'Eventos', path: '/eventos' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <SidebarTrigger className="menu-button" />
              <Link to="/dashboard" className="header-logo">
                <img 
                  src="/images/logo.png" 
                  alt="Sistema IVN" 
                  className="logo-image"
                  onError={(e) => {
                    // Fallback para texto se a imagem não existir
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) {
                      fallback.style.display = 'block';
                    }
                  }}
                  onLoad={(e) => {
                    // Garantir que a imagem está visível e o fallback escondido
                    e.target.style.display = 'block';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) {
                      fallback.style.display = 'none';
                    }
                  }}
                />
                <h1 className="logo-fallback">Sistema IVN</h1>
              </Link>
            </div>
            
            <div className="header-right">
              <ModeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <button className="icon-button aniversariantes-button" type="button" aria-label="Aniversariantes do dia">
                    <Cake className="header-icon" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="notificacoes-sheet">
                  <SheetHeader>
                    <SheetTitle>Aniversariantes do dia</SheetTitle>
                    <SheetDescription>
                      Pessoas que fazem aniversário hoje.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="notificacoes-body">
                    <p className="notificacoes-empty">Sem aniversariantes hoje.</p>
                  </div>
                </SheetContent>
              </Sheet>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="icon-button search-button" type="button" aria-label="Alertas">
                    <Bell className="header-icon" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="notificacoes-sheet">
                  <SheetHeader>
                    <SheetTitle>Notificações</SheetTitle>
                    <SheetDescription>
                      Suas notificações e alertas aparecerão aqui.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="notificacoes-body">
                    <p className="notificacoes-empty">Sem notificações.</p>
                  </div>
                </SheetContent>
              </Sheet>
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
          <Sidebar className="main-layout-sidebar">
            <SidebarHeader className="main-layout-sidebar-header">
              <span className="main-layout-sidebar-title">Navegação</span>
              <SidebarCloseButton />
            </SidebarHeader>
            <SidebarContent className="main-layout-sidebar-content">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = item.path === location.pathname;
                      return (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton asChild isActive={isActive} className="main-layout-nav-item">
                            <Link to={item.path}>
                              <span className="main-layout-nav-icon">
                                <Icon />
                              </span>
                              <span className="main-layout-nav-label">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="main-layout-sidebar-footer">
              <div className="sidebar-user-block">
                <Avatar className="sidebar-user-avatar">
                  <AvatarImage src={user?.fotoPerfil} alt={user?.nome} />
                  <AvatarFallback className="sidebar-user-avatar-fallback">
                    {(user?.nome || 'U').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{user?.nome || 'Usuário'}</span>
                  <span className="sidebar-user-email">{user?.email || ''}</span>
                </div>
              </div>
            </SidebarFooter>
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
