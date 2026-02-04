import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Heart, Gift, Receipt, Calculator, ArrowUpCircle, ArrowDownCircle, Plus, X, PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, MinusCircle, Paperclip, FileText, Search } from 'lucide-react';
import './Financas.css';

const Financas = () => {
  // Estado para o formulário de Nova Entrada
  const [novaEntradaForm, setNovaEntradaForm] = useState({
    categoria: '',
    autores: [],
    autorSelecionado: '',
    valor: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    turno: '',
    tipoPagamento: ''
  });
  const [loadingNovaEntrada, setLoadingNovaEntrada] = useState(false);
  const [messageNovaEntrada, setMessageNovaEntrada] = useState({ type: '', text: '' });
  const [editandoId, setEditandoId] = useState(null);
  
  // Estado para as entradas cadastradas
  const [entradas, setEntradas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estado para o formulário de Nova Saída
  const [novaSaidaForm, setNovaSaidaForm] = useState({
    valor: '',
    dataSaida: new Date().toISOString().split('T')[0],
    motivo: '',
    ministerio: '',
    comprovante: null,
    comprovanteNome: ''
  });
  const [loadingNovaSaida, setLoadingNovaSaida] = useState(false);
  const [messageNovaSaida, setMessageNovaSaida] = useState({ type: '', text: '' });
  const [editandoSaidaId, setEditandoSaidaId] = useState(null);
  
  // Estado para as saídas cadastradas
  const [saidas, setSaidas] = useState([]);
  const [currentPageSaidas, setCurrentPageSaidas] = useState(1);
  const [pageSizeSaidas, setPageSizeSaidas] = useState(10);

  // Estado para relatórios
  const [relatorioFilters, setRelatorioFilters] = useState({
    tipo: '', // 'ENTRADA', 'SAIDA', ou '' para todos
    dataInicio: '',
    dataFim: '',
    categoria: '',
    search: ''
  });
  const [currentPageRelatorio, setCurrentPageRelatorio] = useState(1);
  const [pageSizeRelatorio, setPageSizeRelatorio] = useState(10);
  
  // Lista mockada de usuários - TODO: Substituir por chamada à API
  const [usuarios] = useState([
    { id: 1, nome: 'João Silva' },
    { id: 2, nome: 'Maria Santos' },
    { id: 3, nome: 'Pedro Oliveira' },
    { id: 4, nome: 'Ana Costa' },
    { id: 5, nome: 'Carlos Souza' }
  ]);

  // Lista mockada de ministérios - TODO: Substituir por chamada à API
  const [ministerios] = useState([
    { id: 1, nome: 'Louvor' },
    { id: 2, nome: 'Jovens' },
    { id: 3, nome: 'Crianças' },
    { id: 4, nome: 'Intercessão' },
    { id: 5, nome: 'Recepção' },
    { id: 6, nome: 'Mídia' },
    { id: 7, nome: 'Limpeza' },
    { id: 8, nome: 'Segurança' }
  ]);
  
  const [metrics, setMetrics] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    saldo: 0,
    dizimos: 0,
    ofertas: 0,
    outrasReceitas: 0,
    totalTransacoes: 0,
    mediaTransacao: 0
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    // Simulação de carregamento de métricas
    // TODO: Substituir por chamada real à API
    const loadMetrics = async () => {
      setLoadingMetrics(true);
      try {
        // Simulação de dados - substituir por chamada à API
        setTimeout(() => {
          setMetrics({
            totalEntradas: 125000.50,
            totalSaidas: 85000.25,
            saldo: 40000.25,
            dizimos: 75000.00,
            ofertas: 35000.50,
            outrasReceitas: 15000.00,
            totalTransacoes: 245,
            mediaTransacao: 510.20
          });
          setLoadingMetrics(false);
        }, 500);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        setLoadingMetrics(false);
      }
    };

    loadMetrics();
  }, []);

  // Handlers para o formulário de Nova Entrada
  const handleNovaEntradaChange = (e) => {
    const { name, value } = e.target;
    setNovaEntradaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdicionarAutor = () => {
    const autorId = novaEntradaForm.autorSelecionado;
    if (autorId && !novaEntradaForm.autores.includes(autorId)) {
      setNovaEntradaForm(prev => ({
        ...prev,
        autores: [...prev.autores, autorId],
        autorSelecionado: ''
      }));
    }
  };

  const handleRemoverAutor = (autorId) => {
    setNovaEntradaForm(prev => ({
      ...prev,
      autores: prev.autores.filter(id => id !== autorId)
    }));
  };

  const handleSubmitNovaEntrada = async (e) => {
    e.preventDefault();
    setLoadingNovaEntrada(true);
    setMessageNovaEntrada({ type: '', text: '' });

    // Validações
    if (!novaEntradaForm.categoria) {
      setMessageNovaEntrada({ type: 'error', text: 'Por favor, selecione uma categoria.' });
      setLoadingNovaEntrada(false);
      return;
    }

    if (novaEntradaForm.autores.length === 0) {
      setMessageNovaEntrada({ type: 'error', text: 'Por favor, adicione pelo menos um autor.' });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.valor || parseFloat(novaEntradaForm.valor) <= 0) {
      setMessageNovaEntrada({ type: 'error', text: 'Por favor, informe um valor válido.' });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.dataEntrada) {
      setMessageNovaEntrada({ type: 'error', text: 'Por favor, informe a data da entrada.' });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.turno) {
      setMessageNovaEntrada({ type: 'error', text: 'Por favor, selecione o turno.' });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.tipoPagamento) {
      setMessageNovaEntrada({ type: 'error', text: 'Por favor, selecione o tipo de pagamento.' });
      setLoadingNovaEntrada(false);
      return;
    }

    try {
      // TODO: Substituir por chamada real à API
      const dadosEnvio = {
        categoria: novaEntradaForm.categoria,
        autores: novaEntradaForm.autores,
        valor: parseFloat(novaEntradaForm.valor),
        dataEntrada: novaEntradaForm.dataEntrada,
        turno: novaEntradaForm.turno,
        tipoPagamento: novaEntradaForm.tipoPagamento
      };

      // Simulação de sucesso
      setTimeout(() => {
        if (editandoId) {
          // Atualizar entrada existente
          setEntradas(prev => prev.map(entrada => 
            entrada.id === editandoId 
              ? { ...entrada, ...dadosEnvio, autoresNomes: novaEntradaForm.autores.map(id => {
                  const autor = usuarios.find(u => u.id.toString() === id.toString());
                  return autor?.nome || `ID: ${id}`;
                }) }
              : entrada
          ));
          setMessageNovaEntrada({ type: 'success', text: 'Entrada atualizada com sucesso!' });
        } else {
          // Criar nova entrada
          const novaEntrada = {
            id: Date.now(), // TODO: Usar ID da API
            ...dadosEnvio,
            autoresNomes: novaEntradaForm.autores.map(id => {
              const autor = usuarios.find(u => u.id.toString() === id.toString());
              return autor?.nome || `ID: ${id}`;
            }),
            dataCriacao: new Date().toISOString()
          };
          setEntradas(prev => [novaEntrada, ...prev]);
          setMessageNovaEntrada({ type: 'success', text: 'Entrada cadastrada com sucesso!' });
        }
        
        setNovaEntradaForm({
          categoria: '',
          autores: [],
          autorSelecionado: '',
          valor: '',
          dataEntrada: new Date().toISOString().split('T')[0],
          turno: '',
          tipoPagamento: ''
        });
        setEditandoId(null);
        setLoadingNovaEntrada(false);
      }, 1000);
    } catch (error) {
      setMessageNovaEntrada({ type: 'error', text: 'Erro ao cadastrar entrada. Tente novamente.' });
      setLoadingNovaEntrada(false);
    }
  };

  const handleEditarEntrada = (entrada) => {
    setEditandoId(entrada.id);
    setNovaEntradaForm({
      categoria: entrada.categoria,
      autores: entrada.autores || [],
      autorSelecionado: '',
      valor: entrada.valor.toString(),
      dataEntrada: entrada.dataEntrada,
      turno: entrada.turno,
      tipoPagamento: entrada.tipoPagamento || ''
    });
    // Scroll para o topo do formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletarEntrada = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta entrada?')) {
      setEntradas(prev => {
        const newEntradas = prev.filter(entrada => entrada.id !== id);
        // Ajustar página se necessário
        const newTotalPages = Math.ceil(newEntradas.length / pageSize);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        return newEntradas;
      });
      if (editandoId === id) {
        setEditandoId(null);
        setNovaEntradaForm({
          categoria: '',
          autores: [],
          autorSelecionado: '',
          valor: '',
          dataEntrada: new Date().toISOString().split('T')[0],
          turno: '',
          tipoPagamento: ''
        });
      }
    }
  };

  // Cálculo de paginação
  const totalPages = useMemo(() => Math.ceil(entradas.length / pageSize), [entradas.length, pageSize]);
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize]);
  const paginatedEntradas = useMemo(() => 
    entradas.slice(startIndex, endIndex), 
    [entradas, startIndex, endIndex]
  );

  // Cálculo das páginas para exibição
  const pagesToShow = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  // Handlers para o formulário de Nova Saída
  const handleNovaSaidaChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'comprovante' && files && files.length > 0) {
      setNovaSaidaForm(prev => ({
        ...prev,
        comprovante: files[0],
        comprovanteNome: files[0].name
      }));
    } else {
      setNovaSaidaForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitNovaSaida = async (e) => {
    e.preventDefault();
    setLoadingNovaSaida(true);
    setMessageNovaSaida({ type: '', text: '' });

    // Validações
    if (!novaSaidaForm.valor || parseFloat(novaSaidaForm.valor) <= 0) {
      setMessageNovaSaida({ type: 'error', text: 'Por favor, informe um valor válido.' });
      setLoadingNovaSaida(false);
      return;
    }

    if (!novaSaidaForm.dataSaida) {
      setMessageNovaSaida({ type: 'error', text: 'Por favor, informe a data da saída.' });
      setLoadingNovaSaida(false);
      return;
    }

    if (!novaSaidaForm.motivo || novaSaidaForm.motivo.trim() === '') {
      setMessageNovaSaida({ type: 'error', text: 'Por favor, informe o motivo da saída.' });
      setLoadingNovaSaida(false);
      return;
    }

    if (!novaSaidaForm.ministerio) {
      setMessageNovaSaida({ type: 'error', text: 'Por favor, selecione o ministério.' });
      setLoadingNovaSaida(false);
      return;
    }

    try {
      // TODO: Substituir por chamada real à API
      const dadosEnvio = {
        valor: parseFloat(novaSaidaForm.valor),
        dataSaida: novaSaidaForm.dataSaida,
        motivo: novaSaidaForm.motivo.trim(),
        ministerio: novaSaidaForm.ministerio,
        comprovanteNome: novaSaidaForm.comprovanteNome || null
      };

      // Simulação de sucesso
      setTimeout(() => {
        if (editandoSaidaId) {
          // Atualizar saída existente
          setSaidas(prev => prev.map(saida => 
            saida.id === editandoSaidaId 
              ? { ...saida, ...dadosEnvio }
              : saida
          ));
          setMessageNovaSaida({ type: 'success', text: 'Saída atualizada com sucesso!' });
        } else {
          // Criar nova saída
          const novaSaida = {
            id: Date.now(), // TODO: Usar ID da API
            ...dadosEnvio,
            dataCriacao: new Date().toISOString()
          };
          setSaidas(prev => [novaSaida, ...prev]);
          setMessageNovaSaida({ type: 'success', text: 'Saída cadastrada com sucesso!' });
        }
        
        setNovaSaidaForm({
          valor: '',
          dataSaida: new Date().toISOString().split('T')[0],
          motivo: '',
          ministerio: '',
          comprovante: null,
          comprovanteNome: ''
        });
        setEditandoSaidaId(null);
        setLoadingNovaSaida(false);
      }, 1000);
    } catch (error) {
      setMessageNovaSaida({ type: 'error', text: 'Erro ao cadastrar saída. Tente novamente.' });
      setLoadingNovaSaida(false);
    }
  };

  const handleEditarSaida = (saida) => {
    setEditandoSaidaId(saida.id);
    setNovaSaidaForm({
      valor: saida.valor.toString(),
      dataSaida: saida.dataSaida,
      motivo: saida.motivo || '',
      ministerio: saida.ministerio || '',
      comprovante: null,
      comprovanteNome: saida.comprovanteNome || ''
    });
    // Scroll para o topo do formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletarSaida = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta saída?')) {
      setSaidas(prev => {
        const newSaidas = prev.filter(saida => saida.id !== id);
        // Ajustar página se necessário
        const newTotalPages = Math.ceil(newSaidas.length / pageSizeSaidas);
        if (currentPageSaidas > newTotalPages && newTotalPages > 0) {
          setCurrentPageSaidas(newTotalPages);
        }
        return newSaidas;
      });
      if (editandoSaidaId === id) {
        setEditandoSaidaId(null);
        setNovaSaidaForm({
          valor: '',
          dataSaida: new Date().toISOString().split('T')[0],
          motivo: '',
          ministerio: '',
          comprovante: null,
          comprovanteNome: ''
        });
      }
    }
  };

  // Cálculo de paginação para saídas
  const totalPagesSaidas = useMemo(() => Math.ceil(saidas.length / pageSizeSaidas), [saidas.length, pageSizeSaidas]);
  const startIndexSaidas = useMemo(() => (currentPageSaidas - 1) * pageSizeSaidas, [currentPageSaidas, pageSizeSaidas]);
  const endIndexSaidas = useMemo(() => startIndexSaidas + pageSizeSaidas, [startIndexSaidas, pageSizeSaidas]);
  const paginatedSaidas = useMemo(() => 
    saidas.slice(startIndexSaidas, endIndexSaidas), 
    [saidas, startIndexSaidas, endIndexSaidas]
  );

  // Cálculo das páginas para exibição de saídas
  const pagesToShowSaidas = useMemo(() => {
    const pages = [];
    if (totalPagesSaidas <= 5) {
      for (let i = 1; i <= totalPagesSaidas; i++) {
        pages.push(i);
      }
    } else if (currentPageSaidas <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPageSaidas >= totalPagesSaidas - 2) {
      for (let i = totalPagesSaidas - 4; i <= totalPagesSaidas; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPageSaidas - 2; i <= currentPageSaidas + 2; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [totalPagesSaidas, currentPageSaidas]);

  // Função para combinar entradas e saídas para o relatório
  const relatorioData = useMemo(() => {
    const entradasFormatadas = entradas.map(entrada => ({
      id: `entrada-${entrada.id}`,
      tipo: 'ENTRADA',
      valor: entrada.valor,
      data: entrada.dataEntrada,
      categoria: entrada.categoria,
      descricao: entrada.autoresNomes?.join(', ') || 'N/A',
      turno: entrada.turno,
      tipoPagamento: entrada.tipoPagamento,
      dataCriacao: entrada.dataCriacao
    }));

    const saidasFormatadas = saidas.map(saida => {
      const ministerioNome = ministerios.find(m => m.id.toString() === saida.ministerio.toString())?.nome || 'N/A';
      return {
        id: `saida-${saida.id}`,
        tipo: 'SAIDA',
        valor: saida.valor,
        data: saida.dataSaida,
        categoria: 'Saída',
        descricao: saida.motivo,
        ministerio: ministerioNome,
        comprovante: saida.comprovanteNome,
        dataCriacao: saida.dataCriacao
      };
    });

    return [...entradasFormatadas, ...saidasFormatadas].sort((a, b) => {
      return new Date(b.dataCriacao || b.data) - new Date(a.dataCriacao || a.data);
    });
  }, [entradas, saidas, ministerios]);

  // Filtrar dados do relatório
  const filteredRelatorioData = useMemo(() => {
    return relatorioData.filter(item => {
      // Filtro por tipo
      if (relatorioFilters.tipo && item.tipo !== relatorioFilters.tipo) {
        return false;
      }

      // Filtro por data
      if (relatorioFilters.dataInicio) {
        const itemDate = new Date(item.data);
        const inicioDate = new Date(relatorioFilters.dataInicio);
        if (itemDate < inicioDate) return false;
      }

      if (relatorioFilters.dataFim) {
        const itemDate = new Date(item.data);
        const fimDate = new Date(relatorioFilters.dataFim);
        fimDate.setHours(23, 59, 59, 999);
        if (itemDate > fimDate) return false;
      }

      // Filtro por categoria (apenas para entradas)
      if (relatorioFilters.categoria && item.tipo === 'ENTRADA') {
        if (item.categoria !== relatorioFilters.categoria) {
          return false;
        }
      }

      // Filtro de busca
      if (relatorioFilters.search) {
        const searchLower = relatorioFilters.search.toLowerCase();
        const searchInDescricao = item.descricao?.toLowerCase().includes(searchLower);
        const searchInCategoria = item.categoria?.toLowerCase().includes(searchLower);
        const searchInValor = item.valor.toString().includes(searchLower);
        
        if (!searchInDescricao && !searchInCategoria && !searchInValor) {
          return false;
        }
      }

      return true;
    });
  }, [relatorioData, relatorioFilters]);

  // Paginação do relatório
  const totalPagesRelatorio = useMemo(() => 
    Math.ceil(filteredRelatorioData.length / pageSizeRelatorio), 
    [filteredRelatorioData.length, pageSizeRelatorio]
  );
  const startIndexRelatorio = useMemo(() => 
    (currentPageRelatorio - 1) * pageSizeRelatorio, 
    [currentPageRelatorio, pageSizeRelatorio]
  );
  const endIndexRelatorio = useMemo(() => 
    startIndexRelatorio + pageSizeRelatorio, 
    [startIndexRelatorio, pageSizeRelatorio]
  );
  const paginatedRelatorioData = useMemo(() => 
    filteredRelatorioData.slice(startIndexRelatorio, endIndexRelatorio), 
    [filteredRelatorioData, startIndexRelatorio, endIndexRelatorio]
  );

  // Páginas para exibição do relatório
  const pagesToShowRelatorio = useMemo(() => {
    const pages = [];
    if (totalPagesRelatorio <= 5) {
      for (let i = 1; i <= totalPagesRelatorio; i++) {
        pages.push(i);
      }
    } else if (currentPageRelatorio <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPageRelatorio >= totalPagesRelatorio - 2) {
      for (let i = totalPagesRelatorio - 4; i <= totalPagesRelatorio; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPageRelatorio - 2; i <= currentPageRelatorio + 2; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [totalPagesRelatorio, currentPageRelatorio]);

  const handleRelatorioFilterChange = (name, value) => {
    setRelatorioFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPageRelatorio(1); // Reset para primeira página ao filtrar
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Finanças</h1>
          
          <Tabs defaultValue="analytics" className="financas-tabs">
            <TabsList className="financas-tabs-list">
              <TabsTrigger value="analytics" className="financas-tabs-trigger">
                <BarChart3 className="tab-icon" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="nova-entrada" className="financas-tabs-trigger">
                <PlusCircle className="tab-icon" />
                <span>Nova Entrada</span>
              </TabsTrigger>
              <TabsTrigger value="nova-saida" className="financas-tabs-trigger">
                <MinusCircle className="tab-icon" />
                <span>Nova Saída</span>
              </TabsTrigger>
              <TabsTrigger value="relatorio" className="financas-tabs-trigger">
                <FileText className="tab-icon" />
                <span>Relatório Financeiro</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Analytics Financeiro</h2>
                <p className="analytics-description">Visão geral das métricas financeiras da igreja</p>
                
                {loadingMetrics ? (
                  <div className="metrics-loading">Carregando métricas...</div>
                ) : (
                  <div className="metrics-grid">
                    {/* Card: Total de Entradas */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-entrada">
                          <ArrowUpCircle className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Total de Entradas</CardTitle>
                        <CardDescription>Receitas totais do período</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-entrada">
                          R$ {metrics.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Total de Saídas */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-saida">
                          <ArrowDownCircle className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Total de Saídas</CardTitle>
                        <CardDescription>Despesas totais do período</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-saida">
                          R$ {metrics.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Saldo */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className={`metric-icon-wrapper ${metrics.saldo >= 0 ? 'metric-icon-saldo-positivo' : 'metric-icon-saldo-negativo'}`}>
                          {metrics.saldo >= 0 ? <TrendingUp className="metric-icon" /> : <TrendingDown className="metric-icon" />}
                        </div>
                        <CardTitle className="metric-title">Saldo</CardTitle>
                        <CardDescription>Entradas - Saídas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className={`metric-value ${metrics.saldo >= 0 ? 'metric-value-saldo-positivo' : 'metric-value-saldo-negativo'}`}>
                          R$ {metrics.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Dízimos */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-dizimo">
                          <Heart className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Dízimos</CardTitle>
                        <CardDescription>Total de dízimos recebidos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-dizimo">
                          R$ {metrics.dizimos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="metric-percentage">
                          {metrics.totalEntradas > 0 ? ((metrics.dizimos / metrics.totalEntradas) * 100).toFixed(1) : '0.0'}% das entradas
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Ofertas */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-oferta">
                          <Gift className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Ofertas</CardTitle>
                        <CardDescription>Total de ofertas recebidas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-oferta">
                          R$ {metrics.ofertas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="metric-percentage">
                          {metrics.totalEntradas > 0 ? ((metrics.ofertas / metrics.totalEntradas) * 100).toFixed(1) : '0.0'}% das entradas
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Outras Receitas */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-outras">
                          <DollarSign className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Outras Receitas</CardTitle>
                        <CardDescription>Cantina, eventos, doações</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-outras">
                          R$ {metrics.outrasReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="metric-percentage">
                          {metrics.totalEntradas > 0 ? ((metrics.outrasReceitas / metrics.totalEntradas) * 100).toFixed(1) : '0.0'}% das entradas
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Total de Transações */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-transacoes">
                          <Receipt className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Total de Transações</CardTitle>
                        <CardDescription>Número total de transações</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-transacoes">
                          {metrics.totalTransacoes.toLocaleString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card: Média por Transação */}
                    <Card className="metric-card">
                      <CardHeader className="metric-card-header">
                        <div className="metric-icon-wrapper metric-icon-media">
                          <Calculator className="metric-icon" />
                        </div>
                        <CardTitle className="metric-title">Média por Transação</CardTitle>
                        <CardDescription>Valor médio das transações</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="metric-value metric-value-media">
                          R$ {metrics.mediaTransacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="nova-entrada" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Nova Entrada</h2>
                <p className="analytics-description">Cadastre uma nova entrada financeira</p>
                
                <form onSubmit={handleSubmitNovaEntrada} className="pessoa-form">
                  {messageNovaEntrada.text && (
                    <div className={`form-message ${messageNovaEntrada.type}`}>
                      {messageNovaEntrada.text}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="categoria">Categoria</Label>
                      <select
                        id="categoria"
                        name="categoria"
                        value={novaEntradaForm.categoria}
                        onChange={handleNovaEntradaChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione a categoria</option>
                        <option value="Dízimos">Dízimos</option>
                        <option value="Ofertas">Ofertas</option>
                        <option value="Cantina">Cantina</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="autorSelecionado">Autor(es) da Oferta</Label>
                      <div className="autores-wrapper">
                        <div className="autores-select-wrapper">
                          <select
                            id="autorSelecionado"
                            name="autorSelecionado"
                            value={novaEntradaForm.autorSelecionado}
                            onChange={handleNovaEntradaChange}
                            className="form-select"
                          >
                            <option value="">Selecione um autor</option>
                            {usuarios.map(usuario => (
                              <option key={usuario.id} value={usuario.id}>
                                {usuario.nome}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            onClick={handleAdicionarAutor}
                            className="add-autor-button"
                            disabled={!novaEntradaForm.autorSelecionado}
                          >
                            <Plus className="add-icon" />
                            Adicionar
                          </Button>
                        </div>
                        
                        {novaEntradaForm.autores.length > 0 && (
                          <div className="autores-list">
                            <Label>Autores adicionados:</Label>
                            <div className="autores-tags">
                              {novaEntradaForm.autores.map(autorId => {
                                const autor = usuarios.find(u => u.id.toString() === autorId.toString());
                                return (
                                  <div key={autorId} className="autor-tag">
                                    <span>{autor?.nome || `ID: ${autorId}`}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoverAutor(autorId)}
                                      className="remove-autor-button"
                                    >
                                      <X className="remove-icon" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="valor">Valor</Label>
                      <Input
                        type="number"
                        id="valor"
                        name="valor"
                        value={novaEntradaForm.valor}
                        onChange={handleNovaEntradaChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="dataEntrada">Data da Entrada</Label>
                      <Input
                        type="date"
                        id="dataEntrada"
                        name="dataEntrada"
                        value={novaEntradaForm.dataEntrada}
                        onChange={handleNovaEntradaChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="turno">Turno</Label>
                      <select
                        id="turno"
                        name="turno"
                        value={novaEntradaForm.turno}
                        onChange={handleNovaEntradaChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o turno</option>
                        <option value="Dia">Dia</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <Label htmlFor="tipoPagamento">Tipo de Pagamento</Label>
                      <select
                        id="tipoPagamento"
                        name="tipoPagamento"
                        value={novaEntradaForm.tipoPagamento}
                        onChange={handleNovaEntradaChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Pix">Pix</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    {editandoId && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditandoId(null);
                          setNovaEntradaForm({
                            categoria: '',
                            autores: [],
                            autorSelecionado: '',
                            valor: '',
                            dataEntrada: new Date().toISOString().split('T')[0],
                            turno: ''
                          });
                        }}
                        className="cancel-button"
                      >
                        Cancelar Edição
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      className="submit-button"
                      disabled={loadingNovaEntrada}
                    >
                      {loadingNovaEntrada ? (editandoId ? 'Atualizando...' : 'Enviando...') : (editandoId ? 'Atualizar' : 'Enviar')}
                    </Button>
                  </div>
                </form>

                {/* Tabela de Entradas */}
                <div className="entradas-table-container">
                  <h3 style={{ marginTop: '32px', marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                    Entradas Cadastradas
                  </h3>
                  
                  {entradas.length === 0 ? (
                    <div className="empty-table-message">
                      <p>Nenhuma entrada cadastrada ainda.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-wrapper">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Categoria</TableHead>
                              <TableHead>Autores</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Turno</TableHead>
                              <TableHead>Tipo de Pagamento</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedEntradas.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                  Nenhuma entrada encontrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedEntradas.map((entrada) => (
                                <TableRow key={entrada.id}>
                                  <TableCell>{entrada.categoria}</TableCell>
                                  <TableCell>
                                    <div className="autores-cell">
                                      {entrada.autoresNomes?.join(', ') || 'N/A'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    R$ {entrada.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(entrada.dataEntrada).toLocaleDateString('pt-BR')}
                                  </TableCell>
                                  <TableCell>{entrada.turno}</TableCell>
                                  <TableCell>{entrada.tipoPagamento || 'N/A'}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="table-actions">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditarEntrada(entrada)}
                                        className="action-button edit-button"
                                      >
                                        <Edit className="action-icon" />
                                        Editar
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeletarEntrada(entrada.id)}
                                        className="action-button delete-button"
                                      >
                                        <Trash2 className="action-icon" />
                                        Deletar
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Paginação */}
                      {entradas.length > pageSize && (
                        <div className="pagination-section">
                          <div className="pagination-info">
                            <span>
                              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, entradas.length)} de {entradas.length} entradas
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
                              {pagesToShow.map(pageNum => (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="pagination-button page-number"
                                >
                                  {pageNum}
                                </Button>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage >= totalPages}
                              className="pagination-button"
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nova-saida" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Nova Saída</h2>
                <p className="analytics-description">Cadastre uma nova saída financeira</p>
                
                <form onSubmit={handleSubmitNovaSaida} className="pessoa-form">
                  {messageNovaSaida.text && (
                    <div className={`form-message ${messageNovaSaida.type}`}>
                      {messageNovaSaida.text}
                    </div>
                  )}

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="valorSaida">Valor da Saída</Label>
                      <Input
                        type="number"
                        id="valorSaida"
                        name="valor"
                        value={novaSaidaForm.valor}
                        onChange={handleNovaSaidaChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="dataSaida">Data da Saída</Label>
                      <Input
                        type="date"
                        id="dataSaida"
                        name="dataSaida"
                        value={novaSaidaForm.dataSaida}
                        onChange={handleNovaSaidaChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="motivo">Motivo</Label>
                      <textarea
                        id="motivo"
                        name="motivo"
                        value={novaSaidaForm.motivo}
                        onChange={handleNovaSaidaChange}
                        placeholder="Descreva o motivo da saída"
                        required
                        className="form-textarea"
                        rows="4"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="ministerio">Ministério</Label>
                      <select
                        id="ministerio"
                        name="ministerio"
                        value={novaSaidaForm.ministerio}
                        onChange={handleNovaSaidaChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o ministério</option>
                        {ministerios.map(ministerio => (
                          <option key={ministerio.id} value={ministerio.id}>
                            {ministerio.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="comprovante">Anexar Comprovante</Label>
                      <div className="file-upload-wrapper">
                        <Input
                          type="file"
                          id="comprovante"
                          name="comprovante"
                          onChange={handleNovaSaidaChange}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="form-input file-input"
                        />
                        {novaSaidaForm.comprovanteNome && (
                          <div className="file-name-display">
                            <Paperclip className="file-icon" />
                            <span>{novaSaidaForm.comprovanteNome}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setNovaSaidaForm(prev => ({
                                  ...prev,
                                  comprovante: null,
                                  comprovanteNome: ''
                                }));
                                // Resetar o input de arquivo
                                const fileInput = document.getElementById('comprovante');
                                if (fileInput) fileInput.value = '';
                              }}
                              className="remove-file-button"
                            >
                              <X className="remove-icon" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    {editandoSaidaId && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditandoSaidaId(null);
                          setNovaSaidaForm({
                            valor: '',
                            dataSaida: new Date().toISOString().split('T')[0],
                            motivo: '',
                            ministerio: '',
                            comprovante: null,
                            comprovanteNome: ''
                          });
                          const fileInput = document.getElementById('comprovante');
                          if (fileInput) fileInput.value = '';
                        }}
                        className="cancel-button"
                      >
                        Cancelar Edição
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      className="submit-button"
                      disabled={loadingNovaSaida}
                    >
                      {loadingNovaSaida ? (editandoSaidaId ? 'Atualizando...' : 'Enviando...') : (editandoSaidaId ? 'Atualizar' : 'Enviar')}
                    </Button>
                  </div>
                </form>

                {/* Tabela de Saídas */}
                <div className="entradas-table-container">
                  <h3 style={{ marginTop: '32px', marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                    Saídas Cadastradas
                  </h3>
                  
                  {saidas.length === 0 ? (
                    <div className="empty-table-message">
                      <p>Nenhuma saída cadastrada ainda.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-wrapper">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Valor</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Ministério</TableHead>
                              <TableHead>Comprovante</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedSaidas.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                  Nenhuma saída encontrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedSaidas.map((saida) => {
                                const ministerioNome = ministerios.find(m => m.id.toString() === saida.ministerio.toString())?.nome || 'N/A';
                                return (
                                  <TableRow key={saida.id}>
                                    <TableCell>
                                      R$ {saida.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(saida.dataSaida).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                      <div className="motivo-cell" title={saida.motivo}>
                                        {saida.motivo}
                                      </div>
                                    </TableCell>
                                    <TableCell>{ministerioNome}</TableCell>
                                    <TableCell>
                                      {saida.comprovanteNome ? (
                                        <div className="comprovante-cell">
                                          <Paperclip className="file-icon-small" />
                                          <span>{saida.comprovanteNome}</span>
                                        </div>
                                      ) : (
                                        'N/A'
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="table-actions">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditarSaida(saida)}
                                          className="action-button edit-button"
                                        >
                                          <Edit className="action-icon" />
                                          Editar
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeletarSaida(saida.id)}
                                          className="action-button delete-button"
                                        >
                                          <Trash2 className="action-icon" />
                                          Deletar
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Paginação */}
                      {saidas.length > pageSizeSaidas && (
                        <div className="pagination-section">
                          <div className="pagination-info">
                            <span>
                              Mostrando {((currentPageSaidas - 1) * pageSizeSaidas) + 1} a {Math.min(currentPageSaidas * pageSizeSaidas, saidas.length)} de {saidas.length} saídas
                            </span>
                            <div className="page-size-selector">
                              <Label htmlFor="pageSizeSaidas">Linhas por página:</Label>
                              <select
                                id="pageSizeSaidas"
                                value={pageSizeSaidas}
                                onChange={(e) => {
                                  setPageSizeSaidas(Number(e.target.value));
                                  setCurrentPageSaidas(1);
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
                              onClick={() => setCurrentPageSaidas(prev => Math.max(1, prev - 1))}
                              disabled={currentPageSaidas === 1}
                              className="pagination-button"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </Button>
                            
                            <div className="page-numbers">
                              {pagesToShowSaidas.map(pageNum => (
                                <Button
                                  key={pageNum}
                                  variant={currentPageSaidas === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPageSaidas(pageNum)}
                                  className="pagination-button page-number"
                                >
                                  {pageNum}
                                </Button>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPageSaidas(prev => Math.min(totalPagesSaidas, prev + 1))}
                              disabled={currentPageSaidas >= totalPagesSaidas}
                              className="pagination-button"
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="relatorio" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Relatório Financeiro</h2>
                <p className="analytics-description">Visualize todas as entradas e saídas financeiras</p>
                
                {/* Filtros */}
                <div className="filters-section">
                  <div className="filters-row">
                    <div className="filter-group">
                      <Label htmlFor="filtroTipo">Tipo</Label>
                      <select
                        id="filtroTipo"
                        value={relatorioFilters.tipo}
                        onChange={(e) => handleRelatorioFilterChange('tipo', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Todos</option>
                        <option value="ENTRADA">Entradas</option>
                        <option value="SAIDA">Saídas</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <Label htmlFor="filtroDataInicio">Data Início</Label>
                      <Input
                        type="date"
                        id="filtroDataInicio"
                        value={relatorioFilters.dataInicio}
                        onChange={(e) => handleRelatorioFilterChange('dataInicio', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="filter-group">
                      <Label htmlFor="filtroDataFim">Data Fim</Label>
                      <Input
                        type="date"
                        id="filtroDataFim"
                        value={relatorioFilters.dataFim}
                        onChange={(e) => handleRelatorioFilterChange('dataFim', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="filter-group">
                      <Label htmlFor="filtroCategoria">Categoria</Label>
                      <select
                        id="filtroCategoria"
                        value={relatorioFilters.categoria}
                        onChange={(e) => handleRelatorioFilterChange('categoria', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Todas</option>
                        <option value="Dízimos">Dízimos</option>
                        <option value="Ofertas">Ofertas</option>
                        <option value="Cantina">Cantina</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <div className="filters-row">
                    <div className="filter-group" style={{ flex: 1 }}>
                      <Label htmlFor="filtroSearch">Buscar</Label>
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <Input
                          type="text"
                          id="filtroSearch"
                          placeholder="Buscar por descrição, categoria ou valor..."
                          value={relatorioFilters.search}
                          onChange={(e) => handleRelatorioFilterChange('search', e.target.value)}
                          className="form-input search-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela de Relatório */}
                <div className="entradas-table-container">
                  <div className="table-wrapper">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRelatorioData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              Nenhum registro encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedRelatorioData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className={`tipo-badge ${item.tipo.toLowerCase()}`}>
                                  {item.tipo === 'ENTRADA' ? (
                                    <ArrowUpCircle className="tipo-icon" />
                                  ) : (
                                    <ArrowDownCircle className="tipo-icon" />
                                  )}
                                  <span>{item.tipo}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(item.data).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>{item.categoria}</TableCell>
                              <TableCell>
                                <div className="descricao-cell" title={item.descricao}>
                                  {item.descricao}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={item.tipo === 'ENTRADA' ? 'valor-entrada' : 'valor-saida'}>
                                  {item.tipo === 'ENTRADA' ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="detalhes-cell">
                                  {item.tipo === 'ENTRADA' ? (
                                    <>
                                      {item.turno && <span>Turno: {item.turno}</span>}
                                      {item.tipoPagamento && <span>Pagamento: {item.tipoPagamento}</span>}
                                    </>
                                  ) : (
                                    <>
                                      {item.ministerio && <span>Ministério: {item.ministerio}</span>}
                                      {item.comprovante && <span>Comprovante: {item.comprovante}</span>}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {filteredRelatorioData.length > pageSizeRelatorio && (
                    <div className="pagination-section">
                      <div className="pagination-info">
                        <span>
                          Mostrando {startIndexRelatorio + 1} a {Math.min(endIndexRelatorio, filteredRelatorioData.length)} de {filteredRelatorioData.length} registros
                        </span>
                        <div className="page-size-selector">
                          <Label htmlFor="pageSizeRelatorio">Linhas por página:</Label>
                          <select
                            id="pageSizeRelatorio"
                            value={pageSizeRelatorio}
                            onChange={(e) => {
                              setPageSizeRelatorio(Number(e.target.value));
                              setCurrentPageRelatorio(1);
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
                          onClick={() => setCurrentPageRelatorio(prev => Math.max(1, prev - 1))}
                          disabled={currentPageRelatorio === 1}
                          className="pagination-button"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        
                        <div className="page-numbers">
                          {pagesToShowRelatorio.map(pageNum => (
                            <Button
                              key={pageNum}
                              variant={currentPageRelatorio === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPageRelatorio(pageNum)}
                              className="pagination-button page-number"
                            >
                              {pageNum}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageRelatorio(prev => Math.min(totalPagesRelatorio, prev + 1))}
                          disabled={currentPageRelatorio >= totalPagesRelatorio}
                          className="pagination-button"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default Financas;
