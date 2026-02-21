import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import BackToDashboard from '../../components/BackToDashboard/BackToDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Heart, Gift, Receipt, Calculator, ArrowUpCircle, ArrowDownCircle, Plus, X, PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, MinusCircle, Paperclip, FileText, Search, Settings } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';
import { compressImageForUpload } from '../../utils/compressImage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import './Financas.css';

const Financas = () => {
  const { toast } = useToast();

  // Estado para o formulário de Nova Entrada
  const [novaEntradaForm, setNovaEntradaForm] = useState({
    categoria: '',
    autores: [],
    autorSelecionado: '',
    valor: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    turno: '',
    tipoPagamento: '',
    tipoBancoId: ''
  });
  const [loadingNovaEntrada, setLoadingNovaEntrada] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  // Estado para as entradas cadastradas
  const [entradas, setEntradas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEntradas, setTotalEntradas] = useState(0);

  // Estado para o formulário de Nova Saída
  const [novaSaidaForm, setNovaSaidaForm] = useState({
    valor: '',
    dataSaida: new Date().toISOString().split('T')[0],
    motivo: '',
    ministerio: '',
    comprovante: null,
    comprovanteNome: '',
    tipoBancoId: ''
  });
  const [loadingNovaSaida, setLoadingNovaSaida] = useState(false);
  const [editandoSaidaId, setEditandoSaidaId] = useState(null);
  
  // Estado para as saídas cadastradas
  const [saidas, setSaidas] = useState([]);
  const [currentPageSaidas, setCurrentPageSaidas] = useState(1);
  const [pageSizeSaidas, setPageSizeSaidas] = useState(10);
  const [totalSaidas, setTotalSaidas] = useState(0);

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
  const [relatorioData, setRelatorioData] = useState([]);
  const [totalRelatorio, setTotalRelatorio] = useState(0);
  
  // Lista de pessoas (para seleção de doadores)
  const [pessoas, setPessoas] = useState([]);

  // Lista de ministérios
  const [ministerios, setMinisterios] = useState([]);
  
  // Estados para dialogs de exclusão
  const [deleteEntradaDialogOpen, setDeleteEntradaDialogOpen] = useState(false);
  const [entradaParaExcluir, setEntradaParaExcluir] = useState(null);
  const [deleteSaidaDialogOpen, setDeleteSaidaDialogOpen] = useState(false);
  const [saidaParaExcluir, setSaidaParaExcluir] = useState(null);

  // Tipos de banco (dropdowns em Nova Entrada/Saída + tab Config)
  const [tiposBanco, setTiposBanco] = useState([]);
  const [tiposBancoConfig, setTiposBancoConfig] = useState([]);
  const [configTipoBancoNome, setConfigTipoBancoNome] = useState('');
  const [editandoTipoBancoId, setEditandoTipoBancoId] = useState(null);
  const [loadingTipoBanco, setLoadingTipoBanco] = useState(false);
  const [deleteTipoBancoDialogOpen, setDeleteTipoBancoDialogOpen] = useState(false);
  const [tipoBancoParaExcluir, setTipoBancoParaExcluir] = useState(null);
  
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

  // Carregar métricas
  const loadMetrics = async () => {
    try {
      const metricsResponse = await api.get('/financas/metricas');
      setMetrics(metricsResponse.data);
      setLoadingMetrics(false);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setLoadingMetrics(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Carregar métricas
        await loadMetrics();

        // Carregar entradas
        await loadEntradas();

        // Carregar saídas
        await loadSaidas();

        // Carregar pessoas (para seleção de doadores)
        try {
          const pessoasResponse = await api.get('/pessoas', {
            params: { page: 1, pageSize: 1000 } // Buscar muitas pessoas para o dropdown
          });
          setPessoas(pessoasResponse.data.pessoas || []);
        } catch (error) {
          console.error('Erro ao carregar pessoas:', error);
          toast({
            title: 'Aviso',
            description: 'Erro ao carregar lista de pessoas. Você ainda pode cadastrar entradas.',
            variant: 'destructive',
          });
        }

        // Carregar ministérios
        try {
          const ministeriosResponse = await api.get('/ministerios');
          setMinisterios(ministeriosResponse.data.ministerios || []);
        } catch (error) {
          console.error('Erro ao carregar ministérios:', error);
          toast({
            title: 'Aviso',
            description: 'Erro ao carregar lista de ministérios.',
            variant: 'destructive',
          });
        }

        // Tipos de banco (ativos para dropdowns)
        try {
          const tbResponse = await api.get('/financas/tipos-banco');
          setTiposBanco(tbResponse.data.tiposBanco || []);
        } catch (error) {
          console.error('Erro ao carregar tipos de banco:', error);
        }

        // Tipos de banco (todos para tab Config)
        try {
          const tbConfigResponse = await api.get('/financas/tipos-banco', { params: { apenasAtivos: 'false' } });
          setTiposBancoConfig(tbConfigResponse.data.tiposBanco || []);
        } catch (error) {
          console.error('Erro ao carregar tipos de banco (config):', error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados. Tente novamente.',
          variant: 'destructive',
        });
        setLoadingMetrics(false);
      }
    };

    loadInitialData();
  }, []);

  // Carregar entradas
  const loadEntradas = async () => {
    try {
      const response = await api.get('/financas/entradas', {
        params: {
          page: currentPage,
          pageSize: pageSize
        }
      });
      setEntradas(response.data.entradas.map(e => ({
        id: e.id,
        categoria: e.categoria,
        valor: e.valor,
        dataEntrada: e.dataEntrada,
        turno: e.turno,
        tipoPagamento: e.tipoPagamento,
        autores: e.autores,
        autoresNomes: e.autoresNomes || e.autores.map(a => a.nome).join(', '),
        criadoEm: e.criadoEm
      })));
      setTotalEntradas(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar entradas. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Carregar saídas
  const loadSaidas = async () => {
    try {
      const response = await api.get('/financas/saidas', {
        params: {
          page: currentPageSaidas,
          pageSize: pageSizeSaidas
        }
      });
      setSaidas(response.data.saidas);
      setTotalSaidas(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao carregar saídas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar saídas. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Carregar relatório
  const loadRelatorio = async () => {
    try {
      const response = await api.get('/financas/relatorio', {
        params: {
          ...relatorioFilters,
          page: currentPageRelatorio,
          pageSize: pageSizeRelatorio
        }
      });
      setRelatorioData(response.data.relatorio);
      setTotalRelatorio(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Recarregar entradas quando página mudar
  useEffect(() => {
    loadEntradas();
  }, [currentPage, pageSize]);

  // Recarregar saídas quando página mudar
  useEffect(() => {
    loadSaidas();
  }, [currentPageSaidas, pageSizeSaidas]);

  // Recarregar relatório quando filtros mudarem
  useEffect(() => {
    loadRelatorio();
  }, [relatorioFilters, currentPageRelatorio, pageSizeRelatorio]);

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

    // Validações
    if (!novaEntradaForm.categoria) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma categoria.',
        variant: 'destructive',
      });
      setLoadingNovaEntrada(false);
      return;
    }

    // Autor é obrigatório apenas para Dízimos
    if (novaEntradaForm.categoria === 'Dízimos' && novaEntradaForm.autores.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, adicione pelo menos um autor para a categoria Dízimos.',
        variant: 'destructive',
      });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.valor || parseFloat(novaEntradaForm.valor) <= 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe um valor válido.',
        variant: 'destructive',
      });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.dataEntrada) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a data da entrada.',
        variant: 'destructive',
      });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.turno) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione o turno.',
        variant: 'destructive',
      });
      setLoadingNovaEntrada(false);
      return;
    }

    if (!novaEntradaForm.tipoPagamento) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione o tipo de pagamento.',
        variant: 'destructive',
      });
      setLoadingNovaEntrada(false);
      return;
    }

    try {
      const dadosEnvio = {
        categoria: novaEntradaForm.categoria,
        autores: novaEntradaForm.autores,
        valor: parseFloat(novaEntradaForm.valor),
        dataEntrada: novaEntradaForm.dataEntrada,
        turno: novaEntradaForm.turno,
        tipoPagamento: novaEntradaForm.tipoPagamento
      };
      if (novaEntradaForm.tipoBancoId) dadosEnvio.tipoBancoId = novaEntradaForm.tipoBancoId;

      if (editandoId) {
        // Atualizar entrada existente
        await api.put(`/financas/entradas/${editandoId}`, dadosEnvio);
        toast({
          title: 'Sucesso',
          description: 'Entrada atualizada com sucesso!',
          variant: 'success',
        });
      } else {
        // Criar nova entrada
        await api.post('/financas/entradas', dadosEnvio);
        toast({
          title: 'Sucesso',
          description: 'Entrada cadastrada com sucesso!',
          variant: 'success',
        });
      }
      
      setNovaEntradaForm({
        categoria: '',
        autores: [],
        autorSelecionado: '',
        valor: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        turno: '',
        tipoPagamento: '',
        tipoBancoId: ''
      });
      setEditandoId(null);
      await loadEntradas();
      await loadRelatorio();
      await loadMetrics(); // Atualizar métricas após criar/editar entrada
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao cadastrar entrada. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNovaEntrada(false);
    }
  };

  const handleEditarEntrada = async (entrada) => {
    try {
      const response = await api.get(`/financas/entradas/${entrada.id}`);
      const entradaData = response.data.entrada;
      setEditandoId(entradaData.id);
      setNovaEntradaForm({
        categoria: entradaData.categoria,
        autores: entradaData.autores.map(a => a.id),
        autorSelecionado: '',
        valor: entradaData.valor.toString(),
        dataEntrada: entradaData.data_entrada,
        turno: entradaData.turno,
        tipoPagamento: entradaData.tipo_pagamento || '',
        tipoBancoId: entradaData.tipoBancoId ? String(entradaData.tipoBancoId) : ''
      });
      // Scroll para o topo do formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar entrada. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Abrir dialog de exclusão de entrada
  const handleDeleteEntradaClick = (id) => {
    setEntradaParaExcluir(id);
    setDeleteEntradaDialogOpen(true);
  };

  // Confirmar exclusão de entrada
  const handleConfirmDeleteEntrada = async () => {
    if (!entradaParaExcluir) return;

    try {
      await api.delete(`/financas/entradas/${entradaParaExcluir}`);
      toast({
        title: 'Sucesso',
        description: 'Entrada deletada com sucesso!',
        variant: 'success',
      });
      await loadEntradas();
      await loadRelatorio();
      await loadMetrics(); // Atualizar métricas após exclusão de entrada
      if (editandoId === entradaParaExcluir) {
        setEditandoId(null);
        setNovaEntradaForm({
          categoria: '',
          autores: [],
          autorSelecionado: '',
          valor: '',
          dataEntrada: new Date().toISOString().split('T')[0],
          turno: '',
          tipoPagamento: '',
          tipoBancoId: ''
        });
      }
      setDeleteEntradaDialogOpen(false);
      setEntradaParaExcluir(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao deletar entrada. Tente novamente.',
        variant: 'destructive',
      });
      setDeleteEntradaDialogOpen(false);
      setEntradaParaExcluir(null);
    }
  };

  // Cálculo de paginação (agora usando dados do backend)
  const totalPages = useMemo(() => Math.ceil(totalEntradas / pageSize), [totalEntradas, pageSize]);
  const paginatedEntradas = entradas; // Já vem paginado do backend

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
  const handleNovaSaidaChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'comprovante' && files && files.length > 0) {
      const file = files[0];
      try {
        const fileToUse = file.type.startsWith('image/')
          ? await compressImageForUpload(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.9 })
          : file;
        setNovaSaidaForm(prev => ({
          ...prev,
          comprovante: fileToUse,
          comprovanteNome: fileToUse.name
        }));
      } catch (err) {
        console.error('Erro ao comprimir comprovante:', err);
        setNovaSaidaForm(prev => ({
          ...prev,
          comprovante: file,
          comprovanteNome: file.name
        }));
      }
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

    // Validações
    if (!novaSaidaForm.valor || parseFloat(novaSaidaForm.valor) <= 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe um valor válido.',
        variant: 'destructive',
      });
      setLoadingNovaSaida(false);
      return;
    }

    if (!novaSaidaForm.dataSaida) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a data da saída.',
        variant: 'destructive',
      });
      setLoadingNovaSaida(false);
      return;
    }

    if (!novaSaidaForm.motivo || novaSaidaForm.motivo.trim() === '') {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o motivo da saída.',
        variant: 'destructive',
      });
      setLoadingNovaSaida(false);
      return;
    }

    if (!novaSaidaForm.ministerio) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione o ministério.',
        variant: 'destructive',
      });
      setLoadingNovaSaida(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('valor', parseFloat(novaSaidaForm.valor));
      formData.append('dataSaida', novaSaidaForm.dataSaida);
      formData.append('motivo', novaSaidaForm.motivo.trim());
      formData.append('ministerio', novaSaidaForm.ministerio);
      if (novaSaidaForm.tipoBancoId) formData.append('tipoBancoId', novaSaidaForm.tipoBancoId);
      
      if (novaSaidaForm.comprovante) {
        formData.append('comprovante', novaSaidaForm.comprovante);
      }

      if (editandoSaidaId) {
        // Atualizar saída existente
        await api.put(`/financas/saidas/${editandoSaidaId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({
          title: 'Sucesso',
          description: 'Saída atualizada com sucesso!',
          variant: 'success',
        });
      } else {
        // Criar nova saída
        await api.post('/financas/saidas', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({
          title: 'Sucesso',
          description: 'Saída cadastrada com sucesso!',
          variant: 'success',
        });
      }
      
      setNovaSaidaForm({
        valor: '',
        dataSaida: new Date().toISOString().split('T')[0],
        motivo: '',
        ministerio: '',
        comprovante: null,
        comprovanteNome: '',
        tipoBancoId: ''
      });
      setEditandoSaidaId(null);
      const fileInput = document.getElementById('comprovante');
      if (fileInput) fileInput.value = '';
      await loadSaidas();
      await loadRelatorio();
      await loadMetrics(); // Atualizar métricas após criar/editar saída
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao cadastrar saída. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNovaSaida(false);
    }
  };

  const handleEditarSaida = async (saida) => {
    try {
      const response = await api.get(`/financas/saidas/${saida.id}`);
      const saidaData = response.data.saida;
      setEditandoSaidaId(saidaData.id);
      setNovaSaidaForm({
        valor: saidaData.valor.toString(),
        dataSaida: saidaData.dataSaida,
        motivo: saidaData.motivo || '',
        ministerio: saidaData.ministerioId?.toString() || '',
        comprovante: null,
        comprovanteNome: saidaData.comprovanteNome || '',
        tipoBancoId: saidaData.tipoBancoId ? String(saidaData.tipoBancoId) : ''
      });
      // Scroll para o topo do formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar saída. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Abrir dialog de exclusão de saída
  const handleDeleteSaidaClick = (id) => {
    setSaidaParaExcluir(id);
    setDeleteSaidaDialogOpen(true);
  };

  // Confirmar exclusão de saída
  const handleConfirmDeleteSaida = async () => {
    if (!saidaParaExcluir) return;

    try {
      await api.delete(`/financas/saidas/${saidaParaExcluir}`);
      toast({
        title: 'Sucesso',
        description: 'Saída deletada com sucesso!',
        variant: 'success',
      });
      await loadSaidas();
      await loadRelatorio();
      await loadMetrics(); // Atualizar métricas após exclusão de saída
      if (editandoSaidaId === saidaParaExcluir) {
        setEditandoSaidaId(null);
        setNovaSaidaForm({
          valor: '',
          dataSaida: new Date().toISOString().split('T')[0],
          motivo: '',
          ministerio: '',
          comprovante: null,
          comprovanteNome: '',
          tipoBancoId: ''
        });
        const fileInput = document.getElementById('comprovante');
        if (fileInput) fileInput.value = '';
      }
      setDeleteSaidaDialogOpen(false);
      setSaidaParaExcluir(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao deletar saída. Tente novamente.',
        variant: 'destructive',
      });
      setDeleteSaidaDialogOpen(false);
      setSaidaParaExcluir(null);
    }
  };

  // Cálculo de paginação para saídas (agora usando dados do backend)
  const totalPagesSaidas = useMemo(() => Math.ceil(totalSaidas / pageSizeSaidas), [totalSaidas, pageSizeSaidas]);
  const paginatedSaidas = saidas; // Já vem paginado do backend

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

  // Paginação do relatório (agora usando dados do backend)
  const totalPagesRelatorio = useMemo(() => 
    Math.ceil(totalRelatorio / pageSizeRelatorio), 
    [totalRelatorio, pageSizeRelatorio]
  );
  const paginatedRelatorioData = relatorioData; // Já vem paginado do backend

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

  const loadTiposBancoConfig = async () => {
    try {
      const res = await api.get('/financas/tipos-banco', { params: { apenasAtivos: 'false' } });
      setTiposBancoConfig(res.data.tiposBanco || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de banco:', error);
    }
  };

  const loadTiposBancoAtivos = async () => {
    try {
      const res = await api.get('/financas/tipos-banco');
      setTiposBanco(res.data.tiposBanco || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de banco:', error);
    }
  };

  const handleSubmitTipoBanco = async (e) => {
    e.preventDefault();
    const nome = (configTipoBancoNome || '').trim();
    if (!nome) {
      toast({ title: 'Campo obrigatório', description: 'Informe o nome do banco.', variant: 'destructive' });
      return;
    }
    setLoadingTipoBanco(true);
    try {
      if (editandoTipoBancoId) {
        await api.put(`/financas/tipos-banco/${editandoTipoBancoId}`, { nome });
        toast({ title: 'Sucesso', description: 'Tipo de banco atualizado com sucesso.' });
        setEditandoTipoBancoId(null);
      } else {
        await api.post('/financas/tipos-banco', { nome });
        toast({ title: 'Sucesso', description: 'Tipo de banco incluído com sucesso.' });
      }
      setConfigTipoBancoNome('');
      await loadTiposBancoConfig();
      await loadTiposBancoAtivos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar tipo de banco.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTipoBanco(false);
    }
  };

  const handleEditarTipoBanco = (item) => {
    setConfigTipoBancoNome(item.nome);
    setEditandoTipoBancoId(item.id);
  };

  const handleCancelarEdicaoTipoBanco = () => {
    setConfigTipoBancoNome('');
    setEditandoTipoBancoId(null);
  };

  const handleDeleteTipoBancoClick = (item) => {
    setTipoBancoParaExcluir(item);
    setDeleteTipoBancoDialogOpen(true);
  };

  const handleConfirmDeleteTipoBanco = async () => {
    if (!tipoBancoParaExcluir) return;
    try {
      await api.delete(`/financas/tipos-banco/${tipoBancoParaExcluir.id}`);
      toast({ title: 'Sucesso', description: 'Tipo de banco excluído com sucesso.' });
      await loadTiposBancoConfig();
      await loadTiposBancoAtivos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir tipo de banco.',
        variant: 'destructive',
      });
    }
    setDeleteTipoBancoDialogOpen(false);
    setTipoBancoParaExcluir(null);
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <BackToDashboard />
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
              <TabsTrigger value="config" className="financas-tabs-trigger">
                <Settings className="tab-icon" />
                <span>Config</span>
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
                      <Label htmlFor="autorSelecionado">
                        Autor(es) da Oferta
                        {novaEntradaForm.categoria === 'Dízimos' && <span style={{ color: 'red' }}> *</span>}
                        {novaEntradaForm.categoria && novaEntradaForm.categoria !== 'Dízimos' && <span style={{ color: '#666', fontSize: '0.875rem' }}> (Opcional)</span>}
                      </Label>
                      <div className="autores-wrapper">
                        <div className="autores-select-wrapper">
                          <select
                            id="autorSelecionado"
                            name="autorSelecionado"
                            value={novaEntradaForm.autorSelecionado}
                            onChange={handleNovaEntradaChange}
                            className="form-select"
                          >
                            <option value="">Selecione um doador</option>
                            {pessoas.map(pessoa => (
                              <option key={pessoa.id} value={pessoa.id}>
                                {pessoa.nome} {pessoa.sobrenome || ''}
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
                                const pessoa = pessoas.find(p => p.id.toString() === autorId.toString());
                                const nomeCompleto = pessoa ? `${pessoa.nome} ${pessoa.sobrenome || ''}`.trim() : null;
                                return (
                                  <div key={autorId} className="autor-tag">
                                    <span>{nomeCompleto || `ID: ${autorId}`}</span>
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

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="tipoBancoId">Tipo de banco <span style={{ color: '#666', fontSize: '0.875rem' }}>(Opcional)</span></Label>
                      <select
                        id="tipoBancoId"
                        name="tipoBancoId"
                        value={novaEntradaForm.tipoBancoId}
                        onChange={handleNovaEntradaChange}
                        className="form-select"
                      >
                        <option value="">Nenhum</option>
                        {tiposBanco.map(tb => (
                          <option key={tb.id} value={tb.id}>{tb.nome}</option>
                        ))}
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
                            turno: '',
                            tipoPagamento: '',
                            tipoBancoId: ''
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
                                      {entrada.autoresNomes || 'N/A'}
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
                                        onClick={() => handleDeleteEntradaClick(entrada.id)}
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
                      <Label htmlFor="tipoBancoIdSaida">Tipo de banco <span style={{ color: '#666', fontSize: '0.875rem' }}>(Opcional)</span></Label>
                      <select
                        id="tipoBancoIdSaida"
                        name="tipoBancoId"
                        value={novaSaidaForm.tipoBancoId}
                        onChange={handleNovaSaidaChange}
                        className="form-select"
                      >
                        <option value="">Nenhum</option>
                        {tiposBanco.map(tb => (
                          <option key={tb.id} value={tb.id}>{tb.nome}</option>
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
                            comprovanteNome: '',
                            tipoBancoId: ''
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
                                    <TableCell>{saida.ministerio || 'N/A'}</TableCell>
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
                                          onClick={() => handleDeleteSaidaClick(saida.id)}
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
                  {totalRelatorio > pageSizeRelatorio && (
                    <div className="pagination-section">
                      <div className="pagination-info">
                        <span>
                          Mostrando {((currentPageRelatorio - 1) * pageSizeRelatorio) + 1} a {Math.min(currentPageRelatorio * pageSizeRelatorio, totalRelatorio)} de {totalRelatorio} registros
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

            <TabsContent value="config" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Config</h2>
                <p className="analytics-description">Cadastre tipos de banco para uso opcional em entradas e saídas</p>

                <Card className="config-tipo-banco-card">
                  <CardHeader>
                    <CardTitle>Tipo de banco</CardTitle>
                    <CardDescription>Inclua um novo tipo de banco ou edite um existente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitTipoBanco} className="pessoa-form">
                      <div className="form-row form-row-2">
                        <div className="form-group">
                          <Label htmlFor="configTipoBancoNome">Nome do banco</Label>
                          <Input
                            id="configTipoBancoNome"
                            type="text"
                            value={configTipoBancoNome}
                            onChange={(e) => setConfigTipoBancoNome(e.target.value)}
                            placeholder="Ex: Caixa, Itaú, Nubank"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group form-group-actions">
                          <Label>&nbsp;</Label>
                          <div className="form-actions-inline">
                            {editandoTipoBancoId && (
                              <Button type="button" variant="outline" onClick={handleCancelarEdicaoTipoBanco}>
                                Cancelar
                              </Button>
                            )}
                            <Button type="submit" disabled={loadingTipoBanco}>
                              {loadingTipoBanco ? 'Salvando...' : editandoTipoBancoId ? 'Atualizar' : 'Incluir'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="entradas-table-container">
                  <h3 className="table-section-title">Tipos de banco cadastrados</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="col-acoes">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiposBancoConfig.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2}>Nenhum tipo de banco cadastrado. Use o formulário acima para incluir.</TableCell>
                        </TableRow>
                      ) : (
                        tiposBancoConfig.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>
                              <div className="table-actions">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditarTipoBanco(item)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTipoBancoClick(item)}
                                  title="Excluir"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog de confirmação de exclusão de entrada */}
      <AlertDialog open={deleteEntradaDialogOpen} onOpenChange={setDeleteEntradaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteEntradaDialogOpen(false);
              setEntradaParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteEntrada}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão de saída */}
      <AlertDialog open={deleteSaidaDialogOpen} onOpenChange={setDeleteSaidaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta saída? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteSaidaDialogOpen(false);
              setSaidaParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSaida}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão de tipo de banco */}
      <AlertDialog open={deleteTipoBancoDialogOpen} onOpenChange={setDeleteTipoBancoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de banco &quot;{tipoBancoParaExcluir?.nome}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteTipoBancoDialogOpen(false);
              setTipoBancoParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTipoBanco}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Financas;
