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
import { UserPlus, List, Search, ChevronLeft, ChevronRight, BarChart3, Calendar, MapPin, Users, TrendingUp, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Recepcao.css';

const Recepcao = () => {
  const { user } = useAuth();

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
    nomeCompleto: '',
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
  const [message, setMessage] = useState({ type: '', text: '' });

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
    setMessage({ type: '', text: '' });

    try {
      // Aqui você fará a chamada à API quando estiver pronta
      // const response = await api.post('/visitantes', formData);
      
      // Simulação de sucesso
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Visitante cadastrado com sucesso!' });
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
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao cadastrar visitante. Tente novamente.' });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Recepção</h1>
          
          <Tabs defaultValue="visitante" className="recepcao-tabs">
            <TabsList className="recepcao-tabs-list">
              <TabsTrigger value="visitante" className="recepcao-tabs-trigger">
                <UserPlus className="tab-icon" />
                <span>Visitante</span>
              </TabsTrigger>
              <TabsTrigger value="listar" className="recepcao-tabs-trigger">
                <List className="tab-icon" />
                <span>Listar Visitantes</span>
              </TabsTrigger>
              <TabsTrigger value="estatisticas" className="recepcao-tabs-trigger">
                <BarChart3 className="tab-icon" />
                <span>Estatísticas</span>
              </TabsTrigger>
              <TabsTrigger value="relatorio" className="recepcao-tabs-trigger">
                <FileText className="tab-icon" />
                <span>Relatório</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="visitante" className="recepcao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Cadastrar Visitante</h2>
                
                <form onSubmit={handleSubmit} className="visitante-form">
                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

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

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="dataNascimento">Data de nascimento</Label>
                      <Input
                        type="date"
                        id="dataNascimento"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
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

                    <div className="form-group">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplo.com"
                        required
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
            
            <TabsContent value="listar" className="recepcao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Lista de Visitantes</h2>
                <VisitantesTable />
              </div>
            </TabsContent>

            <TabsContent value="estatisticas" className="recepcao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Estatísticas de Visitantes</h2>
                <EstatisticasVisitantes />
              </div>
            </TabsContent>

            <TabsContent value="relatorio" className="recepcao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Relatório</h2>
                <RelatorioForm />
                <div className="relatorios-section">
                  <RelatoriosGerados />
                </div>
              </div>
            </TabsContent>
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
  const [filters, setFilters] = useState({
    search: '',
    dataVisita: getCurrentDate(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dados mockados
  const mockVisitantes = useMemo(() => {
    const visitantes = [];
    const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Juliana Lima', 'Roberto Alves', 'Fernanda Rocha', 'Lucas Pereira', 'Beatriz Ferreira', 'Rafael Martins', 'Camila Rodrigues', 'Gabriel Dias', 'Larissa Gomes', 'Thiago Barbosa'];
    const bairros = ['Centro', 'Jardim América', 'Vila Nova', 'Bela Vista', 'São José', 'Parque Industrial', 'Alto da Boa Vista'];
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
    const comoConheceu = ['Família/Amigo', 'Google', 'Rede Social', 'Passei em frente'];
    const recepcionistas = ['João Admin', 'Maria Admin', 'Pedro Admin'];

    for (let i = 1; i <= 50; i++) {
      const dataVisita = new Date();
      dataVisita.setDate(dataVisita.getDate() - Math.floor(Math.random() * 30));
      const hora = String(Math.floor(Math.random() * 24)).padStart(2, '0');
      const minuto = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      
      visitantes.push({
        id: i,
        recepcionadoPor: recepcionistas[Math.floor(Math.random() * recepcionistas.length)],
        diaVisita: `${dataVisita.getFullYear()}-${String(dataVisita.getMonth() + 1).padStart(2, '0')}-${String(dataVisita.getDate()).padStart(2, '0')}T${hora}:${minuto}`,
        nomeCompleto: nomes[Math.floor(Math.random() * nomes.length)],
        dataNascimento: `${1980 + Math.floor(Math.random() * 40)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        whatsapp: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `visitante${i}@exemplo.com`,
        bairro: bairros[Math.floor(Math.random() * bairros.length)],
        cidade: cidades[Math.floor(Math.random() * cidades.length)],
        comoConheceu: comoConheceu[Math.floor(Math.random() * comoConheceu.length)],
        pedidoOracao: i % 3 === 0 ? 'Pedido de oração para saúde da família' : i % 3 === 1 ? 'Oração pela paz mundial' : 'Agradecimento pelas bênçãos recebidas',
      });
    }
    return visitantes;
  }, []);

  // Filtrar dados
  const filteredData = useMemo(() => {
    return mockVisitantes.filter(visitante => {
      const matchSearch = !filters.search || 
        visitante.nomeCompleto.toLowerCase().includes(filters.search.toLowerCase()) ||
        visitante.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        visitante.whatsapp.includes(filters.search);
      
      const visitanteDate = visitante.diaVisita.split('T')[0];
      const matchDate = !filters.dataVisita || visitanteDate === filters.dataVisita;
      
      return matchSearch && matchDate;
    });
  }, [mockVisitantes, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Nenhum visitante encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((visitante) => (
                <TableRow key={visitante.id}>
                  <TableCell>{visitante.recepcionadoPor}</TableCell>
                  <TableCell>{formatDate(visitante.diaVisita)}</TableCell>
                  <TableCell>{visitante.nomeCompleto}</TableCell>
                  <TableCell>{formatDate(visitante.dataNascimento)}</TableCell>
                  <TableCell>{visitante.whatsapp}</TableCell>
                  <TableCell>{visitante.email}</TableCell>
                  <TableCell>{visitante.bairro}</TableCell>
                  <TableCell>{visitante.cidade}</TableCell>
                  <TableCell>{visitante.comoConheceu}</TableCell>
                  <TableCell className="max-w-xs truncate" title={visitante.pedidoOracao}>
                    {visitante.pedidoOracao || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="pagination-section">
        <div className="pagination-info">
          <span>
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} visitantes
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
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
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
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
  // Dados mockados para estatísticas
  const estatisticas = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    
    // Estatísticas por período
    const porDia = Array.from({ length: 7 }, (_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (6 - i));
      return {
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        quantidade: Math.floor(Math.random() * 20) + 5
      };
    });

    const porMes = Array.from({ length: 12 }, (_, i) => {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        mes: meses[i],
        quantidade: Math.floor(Math.random() * 50) + 10
      };
    });

    const porAno = Array.from({ length: 5 }, (_, i) => {
      const ano = anoAtual - (4 - i);
      return {
        ano: ano.toString(),
        quantidade: Math.floor(Math.random() * 200) + 100
      };
    });

    // Estatísticas por bairro
    const bairros = ['Centro', 'Jardim América', 'Vila Nova', 'Bela Vista', 'São José', 'Parque Industrial', 'Alto da Boa Vista'];
    const porBairro = bairros.map(bairro => ({
      bairro,
      quantidade: Math.floor(Math.random() * 30) + 5,
      percentual: 0
    }));
    const totalBairros = porBairro.reduce((sum, b) => sum + b.quantidade, 0);
    porBairro.forEach(b => {
      b.percentual = ((b.quantidade / totalBairros) * 100).toFixed(1);
    });

    // Estatísticas por sexo
    const porSexo = [
      { sexo: 'Masculino', quantidade: 45, cor: '#3b82f6' },
      { sexo: 'Feminino', quantidade: 55, cor: '#ec4899' },
      { sexo: 'Não informado', quantidade: 10, cor: '#6b7280' }
    ];
    const totalSexo = porSexo.reduce((sum, s) => sum + s.quantidade, 0);
    porSexo.forEach(s => {
      s.percentual = ((s.quantidade / totalSexo) * 100).toFixed(1);
    });

    // Estatísticas por dia da semana
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const porDiaSemana = diasSemana.map((dia, index) => ({
      dia,
      quantidade: Math.floor(Math.random() * 25) + 5,
      ordem: index
    }));

    return {
      porDia,
      porMes,
      porAno,
      porBairro: porBairro.sort((a, b) => b.quantidade - a.quantidade),
      porSexo,
      porDiaSemana
    };
  }, []);

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

      {/* Estatísticas por Sexo */}
      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <Users className="stat-icon" />
            Visitantes por Sexo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="pie-chart-container">
            {estatisticas.porSexo.map((item, index) => {
              const total = estatisticas.porSexo.reduce((sum, s) => sum + s.quantidade, 0);
              const percentual = ((item.quantidade / total) * 100).toFixed(1);
              return (
                <div key={index} className="pie-chart-item">
                  <div className="pie-chart-indicator" style={{ backgroundColor: item.cor }} />
                  <div className="pie-chart-info">
                    <div className="pie-chart-label">{item.sexo}</div>
                    <div className="pie-chart-value">{item.quantidade} ({percentual}%)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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

// Componente de Formulário de Relatório
const RelatorioForm = () => {
  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
  const mesAtualLabel = meses.find(m => m.value === mesAtual)?.label || 'Janeiro';

  const [formData, setFormData] = useState({
    nomeMinisterio: 'Ministério Recepção',
    mesReferencia: mesAtual,
    conteudo: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditorChange = (value) => {
    setFormData(prev => ({
      ...prev,
      conteudo: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Aqui você fará a chamada à API quando estiver pronta
      // const response = await api.post('/relatorios', formData);
      
      // Simulação de sucesso
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Relatório enviado com sucesso!' });
        setFormData({
          nomeMinisterio: 'Ministério Recepção',
          mesReferencia: mesAtual,
          conteudo: ''
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar relatório. Tente novamente.' });
      setLoading(false);
    }
  };

  // Configuração do editor Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['table'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link', 'image', 'video',
    'table'
  ];

  return (
    <form onSubmit={handleSubmit} className="relatorio-form">
      {message.text && (
        <div className={`form-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor="nomeMinisterio">Nome do Ministério</Label>
          <Input
            type="text"
            id="nomeMinisterio"
            name="nomeMinisterio"
            value={formData.nomeMinisterio}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <Label htmlFor="mesReferencia">Mês de Referência</Label>
          <select
            id="mesReferencia"
            name="mesReferencia"
            value={formData.mesReferencia}
            onChange={handleChange}
            required
            className="form-select"
          >
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Label htmlFor="conteudo">Conteúdo do Relatório</Label>
          <div className="editor-wrapper">
            <ReactQuill
              theme="snow"
              value={formData.conteudo}
              onChange={handleEditorChange}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Digite o conteúdo do relatório..."
              className="rich-text-editor"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar Relatório'}
        </Button>
      </div>
    </form>
  );
};

// Componente de Lista de Relatórios Gerados
const RelatoriosGerados = () => {
  // Dados mockados de relatórios
  const relatorios = useMemo(() => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const relatoriosList = [];
    
    for (let i = 0; i < 12; i++) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mes = meses[data.getMonth()];
      const ano = data.getFullYear();
      
      relatoriosList.push({
        id: i + 1,
        nomeMinisterio: 'Ministério Recepção',
        mesReferencia: mes,
        anoReferencia: ano,
        dataGeracao: data.toLocaleDateString('pt-BR'),
        tamanho: `${Math.floor(Math.random() * 500) + 100} KB`
      });
    }
    
    return relatoriosList;
  }, []);

  const handleDownload = (relatorio) => {
    // Simulação de download
    const link = document.createElement('a');
    link.href = '#'; // Aqui você colocaria a URL real do PDF
    link.download = `Relatorio_${relatorio.nomeMinisterio}_${relatorio.mesReferencia}_${relatorio.anoReferencia}.pdf`;
    // link.click(); // Descomente quando tiver a URL real
    
    // Por enquanto, apenas um alerta
    alert(`Download do relatório: ${relatorio.nomeMinisterio} - ${relatorio.mesReferencia}/${relatorio.anoReferencia}`);
  };

  return (
    <div className="relatorios-gerados-container">
      <h3 className="relatorios-gerados-title">Relatórios Gerados</h3>
      
      {relatorios.length === 0 ? (
        <div className="relatorios-empty">
          <p>Nenhum relatório gerado ainda.</p>
        </div>
      ) : (
        <div className="relatorios-list">
          {relatorios.map((relatorio) => (
            <Card key={relatorio.id} className="relatorio-item">
              <CardContent className="relatorio-item-content">
                <div className="relatorio-item-info">
                  <div className="relatorio-item-header">
                    <h4 className="relatorio-item-nome">{relatorio.nomeMinisterio}</h4>
                    <span className="relatorio-item-data">{relatorio.dataGeracao}</span>
                  </div>
                  <div className="relatorio-item-details">
                    <span className="relatorio-item-mes">
                      {relatorio.mesReferencia} / {relatorio.anoReferencia}
                    </span>
                    <span className="relatorio-item-tamanho">{relatorio.tamanho}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(relatorio)}
                  className="relatorio-download-button"
                >
                  <Download className="download-icon" />
                  <span>Download PDF</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recepcao;
