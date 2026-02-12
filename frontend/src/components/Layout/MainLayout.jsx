import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut, Bell, Cake, User, LayoutDashboard, ClipboardList, Calendar, X } from 'lucide-react';
import api, { API_ORIGIN } from '../../services/api';
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

const STORAGE_KEY_ANIVERSARIANTES_LIDOS = 'aniversariantes-lidos';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLidosCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANIVERSARIANTES_LIDOS);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data[getTodayKey()] ?? 0;
  } catch {
    return 0;
  }
}

function setLidosCount(count) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANIVERSARIANTES_LIDOS);
    const data = raw ? JSON.parse(raw) : {};
    data[getTodayKey()] = count;
    localStorage.setItem(STORAGE_KEY_ANIVERSARIANTES_LIDOS, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar aniversariantes lidos', e);
  }
}

function formatDataNascimento(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

/** Converte path ou base64 de foto em URL utilizável pelo <img src> */
function getAvatarUrl(src) {
  const s = typeof src === 'string' ? src.trim() : '';
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length > 100) {
    return `data:image/jpeg;base64,${s}`;
  }
  const pathNorm = s.replace(/\\/g, '/');
  const path = pathNorm.startsWith('/') ? pathNorm : `/${pathNorm}`;
  return `${API_ORIGIN}${path}`;
}

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [aniversariantes, setAniversariantes] = useState([]);
  const [loadingAniversariantes, setLoadingAniversariantes] = useState(true);
  const [sheetAniversariantesOpen, setSheetAniversariantesOpen] = useState(false);
  const [lidosCount, setLidosCountState] = useState(0);

  const totalHoje = aniversariantes.length;
  const unreadCount = Math.max(0, totalHoje - lidosCount);

  const carregarAniversariantes = useCallback(async () => {
    try {
      setLoadingAniversariantes(true);
      const { data } = await api.get('/aniversariantes-do-dia');
      setAniversariantes(data.aniversariantes ?? []);
      setLidosCountState(getLidosCount());
    } catch (err) {
      console.error('Erro ao carregar aniversariantes do dia', err);
      setAniversariantes([]);
      setLidosCountState(0);
    } finally {
      setLoadingAniversariantes(false);
    }
  }, []);

  useEffect(() => {
    carregarAniversariantes();
  }, [carregarAniversariantes]);

  const handleSheetAniversariantesOpen = (open) => {
    setSheetAniversariantesOpen(open);
    if (open && aniversariantes.length > 0) {
      const count = aniversariantes.length;
      setLidosCount(count);
      setLidosCountState(count);
    }
  };

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
              <Sheet open={sheetAniversariantesOpen} onOpenChange={handleSheetAniversariantesOpen}>
                <SheetTrigger asChild>
                  <button className="icon-button aniversariantes-button" type="button" aria-label="Aniversariantes do dia">
                    <span className="aniversariantes-icon-wrap">
                      <Cake className="header-icon" />
                      {unreadCount > 0 && (
                        <span className="aniversariantes-badge" aria-label={`${unreadCount} não lidos`}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="notificacoes-sheet">
                  <SheetHeader>
                    <SheetTitle>Aniversariantes do dia</SheetTitle>
                    <SheetDescription>
                      Pessoas que fazem aniversário hoje.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="notificacoes-body aniversariantes-body">
                    {loadingAniversariantes ? (
                      <p className="notificacoes-empty">Carregando...</p>
                    ) : aniversariantes.length === 0 ? (
                      <p className="notificacoes-empty">Sem aniversariantes hoje.</p>
                    ) : (
                      <ul className="aniversariantes-list">
                        {aniversariantes.map((p) => (
                          <li key={p.id} className="aniversariantes-list-item">
                            <Avatar className="aniversariantes-avatar">
                              <AvatarImage src={getAvatarUrl(p.fotoPerfil)} alt={p.nome} />
                              <AvatarFallback className="aniversariantes-avatar-fallback">
                                {((p.nome || '').trim().charAt(0) + (p.sobrenome || '').trim().charAt(0)).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="aniversariantes-info">
                              <span className="aniversariantes-nome">
                                {[p.nome, p.sobrenome].filter(Boolean).join(' ')}
                              </span>
                              <span className="aniversariantes-meta">
                                {formatDataNascimento(p.dataNascimento)}
                                {p.idade != null && ` · ${p.idade} ${p.idade === 1 ? 'ano' : 'anos'}`}
                              </span>
                              {p.estagioAtual && (
                                <span className="aniversariantes-estagio">{p.estagioAtual}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
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
                  <AvatarImage src={getAvatarUrl(user?.fotoPerfil)} alt={user?.nome} />
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
