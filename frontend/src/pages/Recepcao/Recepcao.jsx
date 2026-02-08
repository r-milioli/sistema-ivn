import React, { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { UserPlus, List, Search, ChevronLeft, ChevronRight, BarChart3, Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../hooks/use-toast';
import { useTabsPermissoes } from '../../hooks/useTabsPermissoes';
import api from '../../services/api';
import './Recepcao.css';

const Recepcao = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  // Definir tabs padrão
  const tabsPadrao = [
    { value: 'visitante', label: 'Visitante', icon: UserPlus },
    { value: 'listar', label: 'Listar Visitantes', icon: List },
    { value: 'estatisticas', label: 'Estatísticas', icon: BarChart3 }
  ];

  // Obter tabs visíveis baseado nas permissões
  const { tabsVisiveis, loading: loadingTabs } = useTabsPermissoes(tabsPadrao);

  // Função para obter data e hora atual no formato datetime-local
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    recepcionadoPor: user?.nome || '',
    diaVisita: getCurrentDateTime(),
    nomeCompleto: '', // Mantido para compatibilidade, será separado no backend
    dataNascimento: '',
    whatsapp: '',
    email: '',
    bairro: '',
    cidade: '',
    comoConheceu: '',
    pedidoOracao: ''
  });

  // Atualiza a data/hora quando o componente monta
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      recepcionadoPor: user?.nome || '',
      diaVisita: getCurrentDateTime()
    }));
  }, [user]);

  const [loading, setLoading] = useState(false);

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
      const response = await api.post('/visitantes', formData);
      
      toast({
        title: 'Sucesso!',
        description: 'Visitante cadastrado com sucesso!',
      });

      setFormData({
        recepcionadoPor: user?.nome || '',
        diaVisita: getCurrentDateTime(),
        nomeCompleto: '',
        dataNascimento: '',
        whatsapp: '',
        email: '',
        bairro: '',
        cidade: '',
        comoConheceu: '',
        pedidoOracao: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao cadastrar visitante. Tente novamente.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Recepção</h1>
          
          <Tabs defaultValue={tabsVisiveis[0]?.value || "visitante"} className="recepcao-tabs">
            <TabsList className="recepcao-tabs-list">
              {tabsVisiveis.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="recepcao-tabs-trigger">
                    {IconComponent && <IconComponent className="tab-icon" />}
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {tabsVisiveis.some(t => t.value === 'visitante') && (
              <TabsContent value="visitante" className="recepcao-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Cadastrar Visitante</h2>
                  
                  <form onSubmit={handleSubmit} className="visitante-form">
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="recepcionadoPor">Recepcionado por</Label>
                      <Input
                        type="text"
                        id="recepcionadoPor"
                        name="recepcionadoPor"
                        value={formData.recepcionadoPor}
                        readOnly
                        className="form-input form-input-readonly"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="diaVisita">Dia da visita</Label>
                      <Input
                        type="datetime-local"
                        id="diaVisita"
                        name="diaVisita"
                        value={formData.diaVisita}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="nomeCompleto">Nome completo</Label>
                      <Input
                        type="text"
                        id="nomeCompleto"
                        name="nomeCompleto"
                        value={formData.nomeCompleto}
                        onChange={handleChange}
                        placeholder="Digite o nome completo"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="dataNascimento">Data de nascimento</Label>
                      <Input
                        type="date"
                        id="dataNascimento"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="whatsapp">WhatsApp *</Label>
                      <Input
                        type="tel"
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplo.com"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        type="text"
                        id="bairro"
                        name="bairro"
                        value={formData.bairro}
                        onChange={handleChange}
                        placeholder="Digite o bairro"
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        type="text"
                        id="cidade"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleChange}
                        placeholder="Digite a cidade"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="comoConheceu">Como Conheceu a IVN?</Label>
                      <select
                        id="comoConheceu"
                        name="comoConheceu"
                        value={formData.comoConheceu}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione uma opção</option>
                        <option value="familia-amigo">Família/Amigo</option>
                        <option value="google">Google</option>
                        <option value="redesocial">Rede Social</option>
                        <option value="passei-frente">Passei em frente</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="pedidoOracao">Faça aqui seu pedido de oração</Label>
                      <textarea
                        id="pedidoOracao"
                        name="pedidoOracao"
                        value={formData.pedidoOracao}
                        onChange={handleChange}
                        placeholder="Digite seu pedido de oração..."
                        rows="4"
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      className="submit-button"
                      disabled={loading}
                    >
                      {loading ? 'Cadastrando...' : 'Cadastrar Visitante'}
                    </Button>
                  </div>
                  </form>
                </div>
              </TabsContent>
            )}
            
            {tabsVisiveis.some(t => t.value === 'listar') && (
              <TabsContent value="listar" className="recepcao-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Lista de Visitantes</h2>
                  <VisitantesTable />
                </div>
              </TabsContent>
            )}

            {tabsVisiveis.some(t => t.value === 'estatisticas') && (
              <TabsContent value="estatisticas" className="recepcao-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Estatísticas de Visitantes</h2>
                  <EstatisticasVisitantes />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

// Função para obter data atual no formato YYYY-MM-DD
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Componente de Tabela de Visitantes
const VisitantesTable = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    dataVisita: getCurrentDate(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  // Buscar visitantes da API
  useEffect(() => {
    const buscarVisitantes = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          pageSize: pageSize,
        };
        
        if (filters.search) {
          params.search = filters.search;
        }
        
        if (filters.dataVisita) {
          params.dataVisita = filters.dataVisita;
        }

        const response = await api.get('/visitantes', { params });
        setVisitantes(response.data.visitantes);
        setPagination(response.data.pagination);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar visitantes. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    buscarVisitantes();
  }, [currentPage, pageSize, filters.search, filters.dataVisita, toast]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatComoConheceu = (value) => {
    const map = {
      'familia-amigo': 'Família/Amigo',
      'google': 'Google',
      'redesocial': 'Rede Social',
      'passei-frente': 'Passei em frente'
    };
    return map[value] || value;
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + visitantes.length;

  return (
    <div className="visitantes-table-container">
      {/* Área de Filtros */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <Label htmlFor="search">Buscar</Label>
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <Input
                type="text"
                id="search"
                placeholder="Nome, email ou WhatsApp..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <Label htmlFor="dataVisita">Data da Visita</Label>
            <Input
              type="date"
              id="dataVisita"
              value={filters.dataVisita}
              onChange={(e) => handleFilterChange('dataVisita', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        {loading ? (
          <div className="text-center p-8">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recepcionado por</TableHead>
                <TableHead>Dia da visita</TableHead>
                <TableHead>Nome completo</TableHead>
                <TableHead>Data nascimento</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Como conheceu</TableHead>
                <TableHead>Pedido de oração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitantes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Nenhum visitante encontrado
                  </TableCell>
                </TableRow>
              ) : (
                visitantes.map((visitante) => (
                  <TableRow key={visitante.id}>
                    <TableCell>{visitante.recepcionado_por || '-'}</TableCell>
                    <TableCell>{formatDate(visitante.dia_visita)}</TableCell>
                    <TableCell>{visitante.nome_completo}</TableCell>
                    <TableCell>{formatDateOnly(visitante.data_nascimento)}</TableCell>
                    <TableCell>{visitante.whatsapp}</TableCell>
                    <TableCell>{visitante.email}</TableCell>
                    <TableCell>{visitante.bairro}</TableCell>
                    <TableCell>{visitante.cidade}</TableCell>
                    <TableCell>{formatComoConheceu(visitante.como_conheceu)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={visitante.pedido_oracao}>
                      {visitante.pedido_oracao || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginação */}
      <div className="pagination-section">
        <div className="pagination-info">
          <span>
            Mostrando {visitantes.length > 0 ? startIndex + 1 : 0} a {endIndex} de {pagination.total} visitantes
          </span>
          <div className="page-size-selector">
            <Label htmlFor="pageSize">Linhas por página:</Label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="form-select page-size-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="pagination-controls">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="pagination-button page-number"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage === pagination.totalPages || loading}
            className="pagination-button"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente de Estatísticas
const EstatisticasVisitantes = () => {
  const { toast } = useToast();
  const [estatisticas, setEstatisticas] = useState({
    porDia: [],
    porMes: [],
    porAno: [],
    porBairro: [],
    porDiaSemana: [],
    resumo: { hoje: 0, mesAtual: 0, anoAtual: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarEstatisticas = async () => {
      setLoading(true);
      try {
        const response = await api.get('/visitantes/estatisticas');
        setEstatisticas(response.data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar estatísticas. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    buscarEstatisticas();
  }, [toast]);

  return (
    <div className="estatisticas-container">
      {/* Cards de Resumo */}
      <div className="estatisticas-summary">
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Hoje</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porDia[estatisticas.porDia.length - 1]?.quantidade || 0}</div>
            <div className="stat-label">Visitantes</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Este Mês</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porMes.reduce((sum, m) => sum + m.quantidade, 0)}</div>
            <div className="stat-label">Visitantes</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Este Ano</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porAno[estatisticas.porAno.length - 1]?.quantidade || 0}</div>
            <div className="stat-label">Visitantes</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Total</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porAno.reduce((sum, a) => sum + a.quantidade, 0)}</div>
            <div className="stat-label">Visitantes</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico por Dia (últimos 7 dias) */}
      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <Calendar className="stat-icon" />
            Visitantes por Dia (Últimos 7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {estatisticas.porDia.map((item, index) => {
                const maxValue = Math.max(...estatisticas.porDia.map(d => d.quantidade));
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${item.quantidade} visitantes`}
                      />
                    </div>
                    <div className="bar-label">{item.data}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico por Mês */}
      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <TrendingUp className="stat-icon" />
            Visitantes por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {estatisticas.porMes.map((item, index) => {
                const maxValue = Math.max(...estatisticas.porMes.map(m => m.quantidade));
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${item.quantidade} visitantes`}
                      />
                    </div>
                    <div className="bar-label">{item.mes}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico por Ano */}
      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <BarChart3 className="stat-icon" />
            Visitantes por Ano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {estatisticas.porAno.map((item, index) => {
                const maxValue = Math.max(...estatisticas.porAno.map(a => a.quantidade));
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${item.quantidade} visitantes`}
                      />
                    </div>
                    <div className="bar-label">{item.ano}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Bairro */}
      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <MapPin className="stat-icon" />
            Visitantes por Bairro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="list-chart">
            {estatisticas.porBairro.map((item, index) => {
              const maxValue = Math.max(...estatisticas.porBairro.map(b => b.quantidade));
              const width = (item.quantidade / maxValue) * 100;
              return (
                <div key={index} className="list-chart-item">
                  <div className="list-chart-label">
                    <span>{item.bairro}</span>
                    <span className="list-chart-value">{item.quantidade} ({item.percentual}%)</span>
                  </div>
                  <div className="list-chart-bar-wrapper">
                    <div 
                      className="list-chart-bar" 
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Sexo - Removido pois a tabela visitantes não possui campo de sexo */}

      {/* Estatísticas por Dia da Semana */}
      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <Calendar className="stat-icon" />
            Visitantes por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {estatisticas.porDiaSemana.map((item, index) => {
                const maxValue = Math.max(...estatisticas.porDiaSemana.map(d => d.quantidade));
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${item.quantidade} visitantes`}
                      />
                    </div>
                    <div className="bar-label">{item.dia}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recepcao;
