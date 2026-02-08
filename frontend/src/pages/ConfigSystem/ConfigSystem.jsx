import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Settings, Building2, FileText, Edit, X, Eye, EyeOff, Cog } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';
import './ConfigSystem.css';

const ConfigSystem = () => {
  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Config System</h1>
          
          <Tabs defaultValue="geral" className="config-system-tabs">
            <TabsList className="config-system-tabs-list">
              <TabsTrigger value="geral" className="config-system-tabs-trigger">
                <Settings className="tab-icon" />
                <span>Geral</span>
              </TabsTrigger>
              <TabsTrigger value="ministerios" className="config-system-tabs-trigger">
                <Building2 className="tab-icon" />
                <span>Ministérios</span>
              </TabsTrigger>
              <TabsTrigger value="paginas" className="config-system-tabs-trigger">
                <FileText className="tab-icon" />
                <span>Páginas</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="geral" className="config-system-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Geral</h2>
                <p>Configurações gerais do sistema.</p>
              </div>
            </TabsContent>

            <TabsContent value="ministerios" className="config-system-tabs-content">
              <MinisteriosTab />
            </TabsContent>

            <TabsContent value="paginas" className="config-system-tabs-content">
              <PaginasTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

// Componente da Tab Ministérios
const MinisteriosTab = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });
  const [ministerios, setMinisterios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Carregar lista de ministérios
  useEffect(() => {
    loadMinisterios();
  }, []);

  const loadMinisterios = async () => {
    try {
      setLoadingList(true);
      const response = await api.get('/ministerios', {
        params: { incluirInativos: true }
      });
      setMinisterios(response.data.ministerios || []);
    } catch (error) {
      console.error('Erro ao carregar ministérios:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar ministérios. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingList(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Atualizar ministério
        await api.put(`/ministerios/${editingId}`, formData);
        toast({
          title: 'Sucesso!',
          description: 'Ministério atualizado com sucesso!',
        });
      } else {
        // Criar novo ministério
        await api.post('/ministerios', formData);
        toast({
          title: 'Sucesso!',
          description: 'Ministério criado com sucesso!',
        });
      }

      // Limpar formulário e recarregar lista
      setFormData({ nome: '', descricao: '' });
      setEditingId(null);
      await loadMinisterios();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar ministério. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await api.get(`/ministerios/${id}`);
      const ministerio = response.data.ministerio;
      setFormData({
        nome: ministerio.nome || '',
        descricao: ministerio.descricao || ''
      });
      setEditingId(id);
      
      // Scroll para o topo do formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar ministério. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setFormData({ nome: '', descricao: '' });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este ministério?')) {
      return;
    }

    try {
      await api.delete(`/ministerios/${id}`);
      toast({
        title: 'Sucesso!',
        description: 'Ministério excluído com sucesso!',
      });
      await loadMinisterios();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir ministério. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="tab-content-wrapper">
      <h2>Ministérios</h2>
      
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="ministerio-form">
        {editingId && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Modo de Edição:</strong> Você está editando um ministério existente.
            </p>
          </div>
        )}
        
        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="nome">Nome do Ministério</Label>
            <Input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Digite o nome do ministério"
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="descricao">Descrição</Label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Digite a descrição do ministério (opcional)"
              className="form-textarea"
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          {editingId && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancelEdit}
              className="cancel-button"
              disabled={loading}
            >
              Cancelar Edição
            </Button>
          )}
          <Button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading 
              ? (editingId ? 'Atualizando...' : 'Salvando...') 
              : (editingId ? 'Atualizar Ministério' : 'Criar Ministério')
            }
          </Button>
        </div>
      </form>

      {/* Tabela de Ministérios */}
      <div className="ministerios-table-section">
        <h3 className="table-section-title">Ministérios Cadastrados</h3>
        
        {loadingList ? (
          <div className="text-center p-8">Carregando ministérios...</div>
        ) : ministerios.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum ministério cadastrado ainda.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ministerios.map((ministerio) => (
                  <TableRow key={ministerio.id}>
                    <TableCell className="font-medium">{ministerio.nome}</TableCell>
                    <TableCell>{ministerio.descricao || '-'}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${ministerio.ativo ? 'status-active' : 'status-inactive'}`}>
                        {ministerio.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="table-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(ministerio.id)}
                          className="edit-button"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(ministerio.id)}
                          className="delete-button"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

// Mapeamento de tabs por página (baseado nas páginas existentes)
const TABS_POR_PAGINA = {
  '/recepcao': [
    { nome: 'Visitante', valor: 'visitante', icone: 'UserPlus', ordem: 1 },
    { nome: 'Listar Visitantes', valor: 'listar', icone: 'List', ordem: 2 },
    { nome: 'Estatísticas', valor: 'estatisticas', icone: 'BarChart3', ordem: 3 }
  ],
  '/financas': [
    { nome: 'Analytics', valor: 'analytics', icone: 'BarChart3', ordem: 1 },
    { nome: 'Nova Entrada', valor: 'nova-entrada', icone: 'PlusCircle', ordem: 2 },
    { nome: 'Nova Saída', valor: 'nova-saida', icone: 'MinusCircle', ordem: 3 },
    { nome: 'Relatório Financeiro', valor: 'relatorio', icone: 'FileText', ordem: 4 }
  ],
  '/gestao-pessoas': [
    { nome: 'Adicionar Pessoas', valor: 'gestao-pessoas', icone: 'Users', ordem: 1 },
    { nome: 'Editar Pessoas', valor: 'editar-pessoas', icone: 'Edit', ordem: 2 },
    { nome: 'Lista de Pessoas', valor: 'lista-pessoas', icone: 'List', ordem: 3 },
    { nome: 'Atribuição', valor: 'atribuicao', icone: 'UserCog', ordem: 4 }
  ],
  '/eventos': [
    { nome: 'Agenda', valor: 'agenda', icone: 'Calendar', ordem: 1 },
    { nome: 'Novo Evento', valor: 'novo-evento', icone: 'Plus', ordem: 2 }
  ],
  '/batismo': [
    { nome: 'Batismo', valor: 'batismo', icone: 'Droplet', ordem: 1 },
    { nome: 'Alunos Batismo', valor: 'alunos-batismo', icone: 'Users', ordem: 2 }
  ],
  '/integracao': [
    { nome: 'Integra', valor: 'integra', icone: 'UserPlus', ordem: 1 },
    { nome: 'Novo Convertido', valor: 'novo-convertido', icone: 'Heart', ordem: 2 },
    { nome: 'Lista Novos Convertidos', valor: 'lista-novos-convertidos', icone: 'List', ordem: 3 },
    { nome: 'Analytics', valor: 'analytics', icone: 'BarChart3', ordem: 4 }
  ],
  '/relatorio': [
    { nome: 'Relatórios', valor: 'relatorios', icone: 'FileText', ordem: 1 },
    { nome: 'Atribuído a Mim', valor: 'atribuido-mim', icone: 'UserCheck', ordem: 2 }
  ],
  '/membresia': [
    { nome: 'Membresia', valor: 'membresia', icone: 'UserCheck', ordem: 1 },
    { nome: 'Alunos Membresia', valor: 'alunos-membresia', icone: 'Users', ordem: 2 }
  ]
  // Adicione mais páginas conforme necessário
};

// Componente da Tab Páginas
const PaginasTab = () => {
  const { toast } = useToast();
  const [paginas, setPaginas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  
  // Modal de Tabs
  const [modalTabsAberto, setModalTabsAberto] = useState(false);
  const [paginaSelecionadaTabs, setPaginaSelecionadaTabs] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [carregandoTabs, setCarregandoTabs] = useState(false);

  // Modal de Visibilidade da Página
  const [modalVisibilidadeAberto, setModalVisibilidadeAberto] = useState(false);
  const [paginaSelecionadaVisibilidade, setPaginaSelecionadaVisibilidade] = useState(null);
  const [salvandoVisibilidade, setSalvandoVisibilidade] = useState(false);

  // Carregar lista de páginas
  useEffect(() => {
    loadPaginas();
  }, []);


  const loadPaginas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/paginas-config');
      setPaginas(response.data.paginas || []);
    } catch (error) {
      console.error('Erro ao carregar páginas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações de páginas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCardVisivel = async (paginaId, newValue) => {
    try {
      setUpdating(prev => ({ ...prev, [paginaId]: true }));
      
      await api.put(`/paginas-config/${paginaId}`, {
        card_visivel: newValue
      });

      setPaginas(prev => prev.map(p => 
        p.id === paginaId ? { ...p, card_visivel: newValue } : p
      ));

      toast({
        title: 'Sucesso!',
        description: `Card ${newValue ? 'visível' : 'oculto'} com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao atualizar visibilidade do card:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar visibilidade. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => ({ ...prev, [paginaId]: false }));
    }
  };

  const handleAbrirModalVisibilidade = (pagina) => {
    setPaginaSelecionadaVisibilidade({
      ...pagina,
      pagina_visivel_geral: Boolean(pagina.pagina_visivel_geral),
      pagina_visivel_visitantes: Boolean(pagina.pagina_visivel_visitantes),
      pagina_visivel_lider_ministerio: Boolean(pagina.pagina_visivel_lider_ministerio),
      pagina_visivel_participa_ministerio: Boolean(pagina.pagina_visivel_participa_ministerio),
      pagina_visivel_user: Boolean(pagina.pagina_visivel_user),
      pagina_visivel_admin: Boolean(pagina.pagina_visivel_admin),
      pagina_visivel_superadmin: Boolean(pagina.pagina_visivel_superadmin)
    });
    setModalVisibilidadeAberto(true);
  };

  const handleSalvarVisibilidade = async () => {
    if (!paginaSelecionadaVisibilidade) return;

    try {
      setSalvandoVisibilidade(true);
      const response = await api.put(`/paginas-config/${paginaSelecionadaVisibilidade.id}`, {
        pagina_visivel_geral: paginaSelecionadaVisibilidade.pagina_visivel_geral,
        pagina_visivel_visitantes: paginaSelecionadaVisibilidade.pagina_visivel_visitantes,
        pagina_visivel_lider_ministerio: paginaSelecionadaVisibilidade.pagina_visivel_lider_ministerio,
        pagina_visivel_participa_ministerio: paginaSelecionadaVisibilidade.pagina_visivel_participa_ministerio,
        pagina_visivel_user: paginaSelecionadaVisibilidade.pagina_visivel_user,
        pagina_visivel_admin: paginaSelecionadaVisibilidade.pagina_visivel_admin,
        pagina_visivel_superadmin: paginaSelecionadaVisibilidade.pagina_visivel_superadmin
      });

      // Atualizar a lista localmente com os dados retornados pela API
      const paginaAtualizada = response.data.pagina || response.data;
      
      setPaginas(prev => prev.map(p => {
        if (p.id === paginaSelecionadaVisibilidade.id) {
          return { 
            ...p,
            ...paginaAtualizada,
            pagina_visivel_geral: Boolean(paginaAtualizada.pagina_visivel_geral),
            pagina_visivel_visitantes: Boolean(paginaAtualizada.pagina_visivel_visitantes),
            pagina_visivel_lider_ministerio: Boolean(paginaAtualizada.pagina_visivel_lider_ministerio),
            pagina_visivel_participa_ministerio: Boolean(paginaAtualizada.pagina_visivel_participa_ministerio),
            pagina_visivel_user: Boolean(paginaAtualizada.pagina_visivel_user),
            pagina_visivel_admin: Boolean(paginaAtualizada.pagina_visivel_admin),
            pagina_visivel_superadmin: Boolean(paginaAtualizada.pagina_visivel_superadmin)
          };
        }
        return p;
      }));

      toast({
        title: 'Sucesso!',
        description: 'Visibilidade da página atualizada com sucesso!',
      });

      setModalVisibilidadeAberto(false);
    } catch (error) {
      console.error('Erro ao salvar visibilidade:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar visibilidade. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoVisibilidade(false);
    }
  };

  const handleToggleVisibilidade = (campo) => {
    setPaginaSelecionadaVisibilidade(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const handleAbrirModalTabs = async (pagina) => {
    setPaginaSelecionadaTabs(pagina);
    setModalTabsAberto(true);
    setCarregandoTabs(true);
    setTabs([]);

    try {
      const response = await api.get(`/paginas-tabs/pagina/${pagina.id}`);
      const tabsExistentes = response.data.tabs || [];

      if (tabsExistentes.length === 0 && TABS_POR_PAGINA[pagina.rota]) {
        const syncResponse = await api.post(`/paginas-tabs/pagina/${pagina.id}/sincronizar`, {
          tabs: TABS_POR_PAGINA[pagina.rota]
        });
        
        const responseAtualizado = await api.get(`/paginas-tabs/pagina/${pagina.id}`);
        const tabsAtualizadas = responseAtualizado.data.tabs || [];
        setTabs(tabsAtualizadas);
        
        if (tabsAtualizadas.length > 0) {
          toast({
            title: 'Sucesso!',
            description: `${tabsAtualizadas.length} tab(s) sincronizada(s) com sucesso!`,
          });
        }
      } else {
        setTabs(tabsExistentes);
      }
    } catch (error) {
      console.error('Erro ao carregar tabs:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao carregar configurações de tabs. Tente novamente.',
        variant: 'destructive',
      });
      setTabs([]);
    } finally {
      setCarregandoTabs(false);
    }
  };

  const handleAtualizarPermissao = async (tabId, campo, valor) => {
    try {
      await api.put(`/paginas-tabs/${tabId}/permissoes`, {
        [campo]: valor
      });

      setTabs(prev => prev.map(tab => 
        tab.id === tabId ? { ...tab, [campo]: valor } : tab
      ));

      toast({
        title: 'Sucesso!',
        description: 'Permissão atualizada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar permissão. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="tab-content-wrapper">
      <h2>Gerenciamento de Páginas</h2>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Configure a visibilidade das páginas, cards no dashboard e permissões de acesso.
      </p>
      
      {loading ? (
        <div className="text-center p-8">Carregando páginas...</div>
      ) : paginas.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma página configurada ainda.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead className="text-center">Card Visível</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginas.map((pagina) => (
                <TableRow key={pagina.id}>
                  <TableCell className="font-medium">{pagina.nome}</TableCell>
                  <TableCell style={{ color: '#666', fontSize: '0.9rem' }}>{pagina.rota}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={pagina.card_visivel}
                        onCheckedChange={(newValue) => handleToggleCardVisivel(pagina.id, newValue)}
                        disabled={updating[pagina.id]}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleAbrirModalVisibilidade(pagina)}
                        title="Configurar visibilidade da página"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleAbrirModalTabs(pagina)}
                        title="Configurar tabs da página"
                      >
                        <Cog className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Visibilidade da Página */}
      <Dialog open={modalVisibilidadeAberto} onOpenChange={setModalVisibilidadeAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Visibilidade da Página - {paginaSelecionadaVisibilidade?.nome}
            </DialogTitle>
            <DialogDescription>
              Defina quem pode visualizar esta página. Marque todos os níveis de acesso que podem ver a página.
            </DialogDescription>
          </DialogHeader>

          {paginaSelecionadaVisibilidade && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_geral}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_geral')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Geral</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Todos os usuários autenticados</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_visitantes}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_visitantes')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Visitantes</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Apenas visitantes</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_user}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_user')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>User</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Usuários com tipo de acesso "Usuario"</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_lider_ministerio}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_lider_ministerio')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Líder do Ministério</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Líderes do ministério vinculado a esta página</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_participa_ministerio}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_participa_ministerio')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Participante do Ministério</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Participantes do ministério vinculado a esta página</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_admin}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_admin')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Admin</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Administradores do sistema</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Checkbox
                  checked={paginaSelecionadaVisibilidade.pagina_visivel_superadmin}
                  onCheckedChange={() => handleToggleVisibilidade('pagina_visivel_superadmin')}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>SuperAdmin</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Super administradores do sistema</div>
                </div>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button variant="outline" onClick={() => setModalVisibilidadeAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarVisibilidade} disabled={salvandoVisibilidade}>
              {salvandoVisibilidade ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Tabs */}
      <Dialog open={modalTabsAberto} onOpenChange={setModalTabsAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar Tabs - {paginaSelecionadaTabs?.nome}
            </DialogTitle>
            <DialogDescription>
              Configure as permissões de visibilidade das tabs desta página
            </DialogDescription>
          </DialogHeader>

          {carregandoTabs ? (
            <div className="text-center p-8">Carregando tabs...</div>
          ) : tabs.length === 0 ? (
            <div className="text-center p-8">
              <p className="mb-4">Nenhuma tab configurada para esta página.</p>
              {TABS_POR_PAGINA[paginaSelecionadaTabs?.rota] ? (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Esta página possui {TABS_POR_PAGINA[paginaSelecionadaTabs?.rota].length} tab(s) definida(s) no mapeamento.
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        setCarregandoTabs(true);
                        await api.post(`/paginas-tabs/pagina/${paginaSelecionadaTabs.id}/sincronizar`, {
                          tabs: TABS_POR_PAGINA[paginaSelecionadaTabs.rota]
                        });
                        const response = await api.get(`/paginas-tabs/pagina/${paginaSelecionadaTabs.id}`);
                        setTabs(response.data.tabs || []);
                        toast({
                          title: 'Sucesso!',
                          description: 'Tabs sincronizadas com sucesso!',
                        });
                      } catch (error) {
                        console.error('Erro ao sincronizar:', error);
                        toast({
                          title: 'Erro',
                          description: error.response?.data?.message || 'Erro ao sincronizar tabs.',
                          variant: 'destructive',
                        });
                      } finally {
                        setCarregandoTabs(false);
                      }
                    }}
                    disabled={carregandoTabs}
                  >
                    Sincronizar Tabs
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Esta página não possui tabs definidas no mapeamento.
                </p>
              )}
            </div>
          ) : (
            <div className="table-wrapper mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tab</TableHead>
                    <TableHead className="text-center">Geral</TableHead>
                    <TableHead className="text-center">Visitantes</TableHead>
                    <TableHead className="text-center">Líder do Ministério</TableHead>
                    <TableHead className="text-center">Participante do Ministério</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabs.map((tab) => (
                    <TableRow key={tab.id}>
                      <TableCell className="font-medium">{tab.nome}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={tab.visivel_geral}
                          onCheckedChange={(checked) => handleAtualizarPermissao(tab.id, 'visivel_geral', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={tab.visivel_visitantes}
                          onCheckedChange={(checked) => handleAtualizarPermissao(tab.id, 'visivel_visitantes', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={tab.visivel_lider_ministerio}
                          onCheckedChange={(checked) => handleAtualizarPermissao(tab.id, 'visivel_lider_ministerio', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={tab.visivel_participa_ministerio}
                          onCheckedChange={(checked) => handleAtualizarPermissao(tab.id, 'visivel_participa_ministerio', checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigSystem;
