import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Search, UserPlus, Camera, X, Heart, List, ChevronLeft, ChevronRight, GraduationCap, Users, BarChart3, TrendingUp, Calendar, FileText, Download, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
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
import api from '../../services/api';
import './Integracao.css';

const VIA_CEP_URL = 'https://viacep.com.br/ws';

const Integracao = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Estados para pesquisa
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitante, setSelectedVisitante] = useState(null);
  const [pessoasBusca, setPessoasBusca] = useState([]);

  // Estados para formulário
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    sexo: '',
    estadoCivil: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    novoEstagio: '',
    fotoPerfil: null
  });

  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Buscar pessoas da API
  const buscarPessoasAPI = async (query) => {
    if (!query || query.trim().length < 2) {
      setPessoasBusca([]);
      return;
    }

    try {
      const response = await api.get('/pessoas', {
        params: {
          page: 1,
          pageSize: 20,
          search: query
        }
      });
      setPessoasBusca(response.data.pessoas || []);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
      setPessoasBusca([]);
    }
  };

  // Lista mockada de visitantes - TODO: Substituir por chamada à API
  const [visitantes] = useState([
    {
      id: 1,
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao.silva@email.com',
      telefone: '(11) 98765-4321',
      dataNascimento: '1990-05-15',
      sexo: 'masculino',
      estadoCivil: 'solteiro',
      cep: '01310-100',
      rua: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Apto 101',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      estagio: 'Visitante'
    },
    {
      id: 2,
      nome: 'Maria',
      sobrenome: 'Santos',
      email: 'maria.santos@email.com',
      telefone: '(11) 97654-3210',
      dataNascimento: '1985-08-20',
      sexo: 'feminino',
      estadoCivil: 'casado',
      cep: '04530-000',
      rua: 'Avenida Faria Lima',
      numero: '2000',
      complemento: '',
      bairro: 'Itaim Bibi',
      cidade: 'São Paulo',
      estado: 'SP',
      estagio: 'Visitante'
    },
    {
      id: 3,
      nome: 'Pedro',
      sobrenome: 'Oliveira',
      email: 'pedro.oliveira@email.com',
      telefone: '(11) 96543-2109',
      dataNascimento: '1992-12-10',
      sexo: 'masculino',
      estadoCivil: 'solteiro',
      cep: '05433-070',
      rua: 'Rua dos Pinheiros',
      numero: '500',
      complemento: 'Casa',
      bairro: 'Pinheiros',
      cidade: 'São Paulo',
      estado: 'SP',
      estagio: 'Visitante'
    }
  ]);

  // Filtrar visitantes (usando resultado da API)
  const filteredVisitantes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return pessoasBusca.filter(pessoa => {
      const nomeCompleto = `${pessoa.nome} ${pessoa.sobrenome || ''}`.toLowerCase();
      const email = pessoa.email?.toLowerCase() || '';
      const telefone = pessoa.telefone?.replace(/\D/g, '') || '';
      const searchQueryClean = searchQuery.toLowerCase().replace(/\D/g, '');
      
      return nomeCompleto.includes(searchQuery.toLowerCase()) ||
             email.includes(searchQuery.toLowerCase()) ||
             telefone.includes(searchQueryClean);
    });
  }, [searchQuery, pessoasBusca]);

  // Buscar pessoas quando searchQuery mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarPessoasAPI(searchQuery);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Preencher formulário quando visitante for selecionado
  const handleSelectVisitante = (pessoa) => {
    setSelectedVisitante(pessoa);
    // O backend já retorna dataNascimento no formato YYYY-MM-DD ou null
    setFormData({
      nome: pessoa.nome || '',
      sobrenome: pessoa.sobrenome || '',
      email: pessoa.email || '',
      telefone: pessoa.telefone || '',
      dataNascimento: pessoa.dataNascimento || '',
      sexo: pessoa.sexo || '',
      estadoCivil: pessoa.estadoCivil || '',
      cep: pessoa.cep || '',
      rua: pessoa.rua || '',
      numero: pessoa.numero || '',
      complemento: pessoa.complemento || '',
      bairro: pessoa.bairro || '',
      cidade: pessoa.cidade || '',
      estado: pessoa.estado || '',
      novoEstagio: '',
      fotoPerfil: null
    });
    setFotoPerfilPreview(pessoa.fotoPerfil || null);
    setSearchQuery('');
    setMessage({ type: '', text: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ViaCEP: busca endereço pelo CEP e preenche o formulário
  const fetchViaCep = async (cep) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) return null;
      
      const res = await fetch(`${VIA_CEP_URL}/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) return null;
      return {
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      };
    } catch (err) {
      return null;
    }
  };

  const handleCepBlur = async (e) => {
    const cep = e.target.value || '';
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
      const endereco = await fetchViaCep(cep);
      if (endereco) {
        setFormData(prev => ({ ...prev, ...endereco }));
        toast({ 
          title: 'CEP encontrado', 
          description: 'Endereço preenchido automaticamente.' 
        });
      } else {
        toast({ 
          title: 'CEP não encontrado', 
          description: 'Verifique o número e tente novamente.', 
          variant: 'destructive' 
        });
      }
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos de imagem.' });
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
        return;
      }

      setFormData(prev => ({ ...prev, fotoPerfil: file }));
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfilPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverFoto = () => {
    setFormData(prev => ({ ...prev, fotoPerfil: null }));
    setFotoPerfilPreview(selectedVisitante?.fotoPerfil || null);
    const fileInput = document.getElementById('fotoPerfil');
    if (fileInput) fileInput.value = '';
  };

  const handleClearSelection = () => {
    setSelectedVisitante(null);
    setFormData({
      nome: '',
      sobrenome: '',
      email: '',
      telefone: '',
      dataNascimento: '',
      sexo: '',
      estadoCivil: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      novoEstagio: '',
      fotoPerfil: null
    });
    setFotoPerfilPreview(null);
    setSearchQuery('');
    setMessage({ type: '', text: '' });
  };

  // Função para converter arquivo para base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!selectedVisitante) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um visitante para integrar.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.novoEstagio) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione o novo estágio do usuário.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.nome || !formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.sobrenome || !formData.sobrenome.trim()) {
      toast({
        title: 'Erro',
        description: 'Sobrenome é obrigatório.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Converter foto para base64 se houver
      let fotoPerfilBase64 = null;
      if (formData.fotoPerfil) {
        fotoPerfilBase64 = await fileToBase64(formData.fotoPerfil);
      }

      // Preparar payload - sempre enviar todos os campos, null quando vazios
      await api.post('/integracao/integrar-visitante', {
        pessoaId: selectedVisitante.id,
        novoEstagio: formData.novoEstagio,
        observacoes: `Integração realizada via sistema`,
        // Nome e sobrenome são obrigatórios
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        // Demais campos opcionais - null quando vazios
        email: formData.email && formData.email.trim() ? formData.email.trim() : null,
        telefone: formData.telefone && formData.telefone.trim() ? formData.telefone.trim() : null,
        dataNascimento: formData.dataNascimento && formData.dataNascimento.trim() ? formData.dataNascimento.trim() : null,
        sexo: formData.sexo && formData.sexo.trim() ? formData.sexo.trim() : null,
        estadoCivil: formData.estadoCivil && formData.estadoCivil.trim() ? formData.estadoCivil.trim() : null,
        cep: formData.cep || null,
        rua: formData.rua || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        fotoPerfil: fotoPerfilBase64 || null
      });
      
      toast({
        title: 'Sucesso',
        description: 'Visitante integrado com sucesso!',
      });
      
      // Limpar formulário após sucesso
      handleClearSelection();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao integrar visitante. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Estados para formulário de Novo Convertido
  const [novoConvertidoFormData, setNovoConvertidoFormData] = useState({
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

  const [loadingNovoConvertido, setLoadingNovoConvertido] = useState(false);
  const [messageNovoConvertido, setMessageNovoConvertido] = useState({ type: '', text: '' });

  // Atualiza a data/hora quando o componente monta
  useEffect(() => {
    setNovoConvertidoFormData(prev => ({
      ...prev,
      recepcionadoPor: user?.nome || '',
      diaVisita: getCurrentDateTime()
    }));
  }, [user]);

  const handleNovoConvertidoChange = (e) => {
    const { name, value } = e.target;
    setNovoConvertidoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNovoConvertidoSubmit = async (e) => {
    e.preventDefault();
    setLoadingNovoConvertido(true);
    setMessageNovoConvertido({ type: '', text: '' });

    // Validação: apenas nome e bairro são obrigatórios
    if (!novoConvertidoFormData.nomeCompleto || !novoConvertidoFormData.nomeCompleto.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome completo é obrigatório.',
        variant: 'destructive',
      });
      setLoadingNovoConvertido(false);
      return;
    }

    if (!novoConvertidoFormData.bairro || !novoConvertidoFormData.bairro.trim()) {
      toast({
        title: 'Erro',
        description: 'Bairro é obrigatório.',
        variant: 'destructive',
      });
      setLoadingNovoConvertido(false);
      return;
    }

    // Primeiro, cadastrar como visitante - enviar null para campos vazios
    try {
      const visitanteResponse = await api.post('/visitantes', {
        nomeCompleto: novoConvertidoFormData.nomeCompleto.trim(),
        dataNascimento: novoConvertidoFormData.dataNascimento && novoConvertidoFormData.dataNascimento.trim() ? novoConvertidoFormData.dataNascimento.trim() : null,
        whatsapp: novoConvertidoFormData.whatsapp && novoConvertidoFormData.whatsapp.trim() ? novoConvertidoFormData.whatsapp.trim() : null,
        email: novoConvertidoFormData.email && novoConvertidoFormData.email.trim() ? novoConvertidoFormData.email.trim() : null,
        bairro: novoConvertidoFormData.bairro.trim(),
        cidade: novoConvertidoFormData.cidade && novoConvertidoFormData.cidade.trim() ? novoConvertidoFormData.cidade.trim() : null,
        comoConheceu: novoConvertidoFormData.comoConheceu && novoConvertidoFormData.comoConheceu.trim() ? novoConvertidoFormData.comoConheceu.trim() : null,
        pedidoOracao: novoConvertidoFormData.pedidoOracao && novoConvertidoFormData.pedidoOracao.trim() ? novoConvertidoFormData.pedidoOracao.trim() : null,
        diaVisita: novoConvertidoFormData.diaVisita || new Date().toISOString()
      });

      // Verificar a estrutura da resposta e obter pessoaId
      // O backend retorna pessoa_id (snake_case)
      let pessoaId = null;
      if (visitanteResponse.data && visitanteResponse.data.visitante) {
        pessoaId = visitanteResponse.data.visitante.pessoa_id || visitanteResponse.data.visitante.pessoaId;
      } else if (visitanteResponse.data && visitanteResponse.data.pessoaId) {
        pessoaId = visitanteResponse.data.pessoaId;
      } else if (visitanteResponse.data && visitanteResponse.data.pessoa_id) {
        pessoaId = visitanteResponse.data.pessoa_id;
      }

      // Validar se pessoaId foi obtido
      if (!pessoaId) {
        toast({
          title: 'Erro',
          description: 'Não foi possível obter o ID da pessoa cadastrada.',
          variant: 'destructive',
        });
        setLoadingNovoConvertido(false);
        return;
      }

      // Garantir que pessoaId seja um número inteiro
      pessoaId = parseInt(pessoaId, 10);
      if (isNaN(pessoaId) || pessoaId <= 0) {
        toast({
          title: 'Erro',
          description: 'ID da pessoa inválido.',
          variant: 'destructive',
        });
        setLoadingNovoConvertido(false);
        return;
      }

      // Converter diaVisita (datetime-local) para ISO 8601
      // Se diaVisita não estiver preenchido, usar data/hora atual
      let dataConversaoISO = new Date().toISOString();
      if (novoConvertidoFormData.diaVisita && novoConvertidoFormData.diaVisita.trim()) {
        try {
          // Converter datetime-local (YYYY-MM-DDTHH:mm) para ISO 8601
          const dateTimeLocal = novoConvertidoFormData.diaVisita.trim();
          const date = new Date(dateTimeLocal);
          if (!isNaN(date.getTime())) {
            dataConversaoISO = date.toISOString();
          }
        } catch (error) {
          console.error('Erro ao converter data:', error);
          // Usar data/hora atual como fallback
        }
      }

      // Depois, registrar a conversão
      await api.post('/integracao/conversoes', {
        pessoaId: pessoaId,
        dataConversao: dataConversaoISO,
        localConversao: 'Culto',
        testemunho: `Novo convertido cadastrado via sistema`
      });

      toast({
        title: 'Sucesso',
        description: 'Novo convertido cadastrado com sucesso!',
      });

      setNovoConvertidoFormData({
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
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao cadastrar novo convertido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNovoConvertido(false);
    }
  };

  // Estados para tab Membresia
  const [membresiaSearchQuery, setMembresiaSearchQuery] = useState('');
  const [selectedNovoConvertido, setSelectedNovoConvertido] = useState(null);
  const [membresiaFormData, setMembresiaFormData] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    dataMatricula: new Date().toISOString().split('T')[0]
  });
  const [alunosMembresia, setAlunosMembresia] = useState([]);
  const [loadingMembresia, setLoadingMembresia] = useState(false);
  const [messageMembresia, setMessageMembresia] = useState({ type: '', text: '' });
  const [novosConvertidosBusca, setNovosConvertidosBusca] = useState([]);
  const [currentPageMembresia, setCurrentPageMembresia] = useState(1);
  const [pageSizeMembresia, setPageSizeMembresia] = useState(10);
  const [totalMatriculas, setTotalMatriculas] = useState(0);

  // Carregar matrículas
  const loadMatriculas = async () => {
    try {
      const response = await api.get('/integracao/membresia/matriculas', {
        params: {
          page: currentPageMembresia,
          pageSize: pageSizeMembresia
        }
      });
      
      // Mapear dados do backend (snake_case) para frontend (camelCase)
      const matriculasMapeadas = (response.data.matriculas || []).map(matricula => ({
        id: matricula.id,
        pessoaId: matricula.pessoa_id,
        nomeCompleto: matricula.nome_completo || `${matricula.nome || ''} ${matricula.sobrenome || ''}`.trim(),
        email: (matricula.email !== null && matricula.email !== undefined && matricula.email !== '') ? matricula.email : '',
        telefone: (matricula.telefone !== null && matricula.telefone !== undefined && matricula.telefone !== '') ? matricula.telefone : '',
        dataMatricula: matricula.data_matricula || matricula.dataMatricula,
        dataConclusao: matricula.data_conclusao || matricula.dataConclusao,
        concluido: matricula.concluido || matricula.concluido,
        estagioAtual: matricula.estagio_atual || matricula.estagioAtual || 'Em Membresia',
        aulas: (matricula.aulas || []).map(aula => ({
          numero: aula.numero || aula.aula_numero,
          concluida: aula.concluida || false,
          dataConclusao: aula.dataConclusao || aula.data_conclusao,
          observacoes: aula.observacoes || null
        }))
      }));
      
      setAlunosMembresia(matriculasMapeadas);
      setTotalMatriculas(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar matrículas. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Carregar matrículas quando página mudar
  useEffect(() => {
    loadMatriculas();
  }, [currentPageMembresia, pageSizeMembresia]);

  // Buscar novos convertidos da API
  const buscarNovosConvertidosAPI = async (query) => {
    if (!query || query.trim().length < 2) {
      setNovosConvertidosBusca([]);
      return;
    }

    try {
      const response = await api.get('/pessoas', {
        params: {
          page: 1,
          pageSize: 20,
          search: query,
          estagio: 'Novo Convertido'
        }
      });
      setNovosConvertidosBusca(response.data.pessoas || []);
    } catch (error) {
      console.error('Erro ao buscar novos convertidos:', error);
      setNovosConvertidosBusca([]);
    }
  };

  // Buscar novos convertidos quando searchQuery mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarNovosConvertidosAPI(membresiaSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [membresiaSearchQuery]);

  // Lista mockada de novos convertidos para pesquisa
  const mockNovosConvertidosParaMembresia = useMemo(() => {
    const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Juliana Lima', 'Roberto Alves', 'Fernanda Rocha', 'Lucas Pereira', 'Beatriz Ferreira'];
    const novosConvertidos = [];
    
    for (let i = 1; i <= 20; i++) {
      novosConvertidos.push({
        id: i,
        nomeCompleto: nomes[Math.floor(Math.random() * nomes.length)] + ` ${i}`,
        email: `novoconvertido${i}@exemplo.com`,
        telefone: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
        dataNascimento: `${1980 + Math.floor(Math.random() * 40)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        endereco: `Rua Exemplo ${i}, ${Math.floor(Math.random() * 999)}`,
        cidade: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'][Math.floor(Math.random() * 5)]
      });
    }
    return novosConvertidos;
  }, []);

  // Filtrar novos convertidos para pesquisa (usando resultado da API)
  const filteredNovosConvertidos = useMemo(() => {
    if (!membresiaSearchQuery.trim()) return [];
    if (!novosConvertidosBusca || !Array.isArray(novosConvertidosBusca)) return [];
    return novosConvertidosBusca.slice(0, 5);
  }, [membresiaSearchQuery, novosConvertidosBusca]);

  // Selecionar novo convertido e preencher formulário
  const handleSelectNovoConvertido = (pessoa) => {
    setSelectedNovoConvertido(pessoa);
    // Converter data de nascimento para formato YYYY-MM-DD se existir
    let dataNascimentoFormatada = '';
    if (pessoa.dataNascimento) {
      if (typeof pessoa.dataNascimento === 'string' && pessoa.dataNascimento.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataNascimentoFormatada = pessoa.dataNascimento;
      } else {
        try {
          const date = new Date(pessoa.dataNascimento);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dataNascimentoFormatada = `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error('Erro ao converter data de nascimento:', e);
        }
      }
    }
    
    setMembresiaFormData({
      nomeCompleto: `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim(),
      email: pessoa.email || '',
      telefone: pessoa.telefone || pessoa.whatsapp || '',
      dataNascimento: dataNascimentoFormatada,
      dataMatricula: new Date().toISOString().split('T')[0]
    });
    setMembresiaSearchQuery('');
  };

  // Limpar seleção de membresia
  const handleClearMembresiaSelection = () => {
    setSelectedNovoConvertido(null);
    setMembresiaFormData({
      nomeCompleto: '',
      email: '',
      telefone: '',
      dataNascimento: '',
      dataMatricula: new Date().toISOString().split('T')[0]
    });
    setMembresiaSearchQuery('');
  };

  // Mudança no formulário
  const handleMembresiaFormChange = (e) => {
    const { name, value } = e.target;
    setMembresiaFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submeter matrícula
  const handleMembresiaSubmit = async (e) => {
    e.preventDefault();
    setLoadingMembresia(true);
    setMessageMembresia({ type: '', text: '' });

    if (!selectedNovoConvertido) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um novo convertido para matricular.',
        variant: 'destructive',
      });
      setLoadingMembresia(false);
      return;
    }

    try {
      const response = await api.post('/integracao/membresia/matricular', {
        pessoaId: selectedNovoConvertido.id,
        dataMatricula: membresiaFormData.dataMatricula
      });

      toast({
        title: 'Sucesso',
        description: 'Matrícula realizada com sucesso!',
      });

      // Recarregar matrículas
      await loadMatriculas();
      handleClearMembresiaSelection();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao realizar matrícula. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembresia(false);
    }
  };

  // Marcar/desmarcar aula
  const handleToggleAula = async (matriculaId, aulaNumero) => {
    try {
      // Buscar estado atual da aula
      const matricula = alunosMembresia.find(m => m.id === matriculaId);
      const aula = matricula?.aulas.find(a => a.numero === parseInt(aulaNumero));
      const novaConcluida = !aula?.concluida;

      await api.put(`/integracao/membresia/matriculas/${matriculaId}/aulas/${aulaNumero}`, {
        concluida: novaConcluida
      });

      toast({
        title: 'Sucesso',
        description: `Aula ${aulaNumero} ${novaConcluida ? 'marcada como concluída' : 'desmarcada'} com sucesso!`,
      });

      // Recarregar matrículas
      await loadMatriculas();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar status da aula. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Integração</h1>
          
          <Tabs defaultValue="integra" className="integracao-tabs">
            <TabsList className="integracao-tabs-list">
              <TabsTrigger value="integra" className="integracao-tabs-trigger">
                <UserPlus className="tab-icon" />
                <span>Integra</span>
              </TabsTrigger>
              <TabsTrigger value="novo-convertido" className="integracao-tabs-trigger">
                <Heart className="tab-icon" />
                <span>Novo Convertido</span>
              </TabsTrigger>
              <TabsTrigger value="lista-novos-convertidos" className="integracao-tabs-trigger">
                <List className="tab-icon" />
                <span>Lista Novos Convertidos</span>
              </TabsTrigger>
              <TabsTrigger value="membresia" className="integracao-tabs-trigger">
                <GraduationCap className="tab-icon" />
                <span>Membresia</span>
              </TabsTrigger>
              <TabsTrigger value="listar-membros" className="integracao-tabs-trigger">
                <Users className="tab-icon" />
                <span>Alunos Membresia</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="integracao-tabs-trigger">
                <BarChart3 className="tab-icon" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="integracao-tabs-trigger">
                <FileText className="tab-icon" />
                <span>Relatórios</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="integra" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Integrar Visitante</h2>
                
                {/* Campo de Pesquisa */}
                <div className="search-section">
                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="search-visitante">Buscar Visitante</Label>
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <Input
                          type="text"
                          id="search-visitante"
                          placeholder="Digite o nome, email ou telefone..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="form-input search-input"
                          disabled={!!selectedVisitante}
                        />
                      </div>
                      
                      {/* Lista de resultados da pesquisa */}
                      {searchQuery && !selectedVisitante && filteredVisitantes.length > 0 && (
                        <div className="search-results">
                          {filteredVisitantes.map(visitante => (
                            <div
                              key={visitante.id}
                              className="search-result-item"
                              onClick={() => handleSelectVisitante(visitante)}
                            >
                              <div className="result-item-info">
                                <div className="result-item-name">
                                  {visitante.nome} {visitante.sobrenome}
                                </div>
                                <div className="result-item-details">
                                  {visitante.email && <span>{visitante.email}</span>}
                                  {visitante.telefone && <span>{visitante.telefone}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchQuery && !selectedVisitante && filteredVisitantes.length === 0 && (
                        <div className="search-no-results">
                          Nenhum visitante encontrado
                        </div>
                      )}

                      {/* Visitante selecionado */}
                      {selectedVisitante && (
                        <div className="selected-person">
                          <div className="selected-person-info">
                            <div className="selected-person-name">
                              {selectedVisitante.nome} {selectedVisitante.sobrenome || ''}
                            </div>
                            <div className="selected-person-details">
                              {selectedVisitante.email && <span>{selectedVisitante.email}</span>}
                              {selectedVisitante.telefone && <span>{selectedVisitante.telefone}</span>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearSelection}
                            className="clear-selection-button"
                          >
                            Limpar Seleção
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formulário */}
                {selectedVisitante && (
                  <form onSubmit={handleSubmit} className="pessoa-form">
                    {message.text && (
                      <div className={`form-message ${message.type}`}>
                        {message.text}
                      </div>
                    )}

                    {/* Campo de Foto de Perfil */}
                    <div className="form-row">
                      <div className="form-group">
                        <Label>Foto de Perfil</Label>
                        <div className="foto-perfil-wrapper">
                          <div className="foto-perfil-avatar">
                            <Avatar className="foto-avatar">
                              <AvatarImage 
                                src={fotoPerfilPreview} 
                                alt="Foto de perfil"
                              />
                              <AvatarFallback>
                                {formData.nome && formData.sobrenome 
                                  ? `${formData.nome.charAt(0)}${formData.sobrenome.charAt(0)}`.toUpperCase()
                                  : formData.nome 
                                    ? formData.nome.charAt(0).toUpperCase()
                                    : 'V'}
                              </AvatarFallback>
                            </Avatar>
                            <label htmlFor="fotoPerfil" className="avatar-edit-button">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="avatar-edit-icon-button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  document.getElementById('fotoPerfil')?.click();
                                }}
                              >
                                <Camera className="h-4 w-4" />
                              </Button>
                            </label>
                            {fotoPerfilPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="avatar-remove-button"
                                onClick={handleRemoverFoto}
                                title="Remover foto"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="foto-upload-controls">
                            <Input
                              type="file"
                              id="fotoPerfil"
                              name="fotoPerfil"
                              onChange={handleFotoChange}
                              accept="image/*"
                              className="foto-input-hidden"
                            />
                            <p className="foto-hint">Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          type="text"
                          id="nome"
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          placeholder="Digite o nome"
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="sobrenome">Sobrenome completo</Label>
                        <Input
                          type="text"
                          id="sobrenome"
                          name="sobrenome"
                          value={formData.sobrenome}
                          onChange={handleChange}
                          placeholder="Digite o sobrenome"
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row form-row-2">
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
                      <div className="form-group">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          type="tel"
                          id="telefone"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          placeholder="(00) 00000-0000"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="dataNascimento">Data de Nascimento</Label>
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
                        <Label htmlFor="sexo">Sexo</Label>
                        <select
                          id="sexo"
                          name="sexo"
                          value={formData.sexo}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">Selecione (opcional)</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                          <option value="nao-informar">Prefiro não informar</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="estadoCivil">Estado Civil</Label>
                        <select
                          id="estadoCivil"
                          name="estadoCivil"
                          value={formData.estadoCivil}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">Selecione (opcional)</option>
                          <option value="solteiro">Solteiro(a)</option>
                          <option value="casado">Casado(a)</option>
                          <option value="divorciado">Divorciado(a)</option>
                          <option value="viuvo">Viúvo(a)</option>
                          <option value="uniao-estavel">União Estável</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          type="text"
                          id="cep"
                          name="cep"
                          value={formData.cep}
                          onChange={handleChange}
                          onBlur={handleCepBlur}
                          placeholder="00000-000"
                          className="form-input"
                          maxLength={9}
                        />
                        <span className="cep-hint" style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px', display: 'block' }}>
                          Digite o CEP e saia do campo para preencher o endereço automaticamente
                        </span>
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group" style={{ flex: 2 }}>
                        <Label htmlFor="rua">Rua</Label>
                        <Input
                          type="text"
                          id="rua"
                          name="rua"
                          value={formData.rua}
                          onChange={handleChange}
                          placeholder="Digite o nome da rua"
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          type="text"
                          id="numero"
                          name="numero"
                          value={formData.numero}
                          onChange={handleChange}
                          placeholder="Nº"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          type="text"
                          id="complemento"
                          name="complemento"
                          value={formData.complemento}
                          onChange={handleChange}
                          placeholder="Apartamento, bloco, etc. (opcional)"
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
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="estado">Estado</Label>
                        <select
                          id="estado"
                          name="estado"
                          value={formData.estado}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">Selecione o estado</option>
                          <option value="AC">Acre</option>
                          <option value="AL">Alagoas</option>
                          <option value="AP">Amapá</option>
                          <option value="AM">Amazonas</option>
                          <option value="BA">Bahia</option>
                          <option value="CE">Ceará</option>
                          <option value="DF">Distrito Federal</option>
                          <option value="ES">Espírito Santo</option>
                          <option value="GO">Goiás</option>
                          <option value="MA">Maranhão</option>
                          <option value="MT">Mato Grosso</option>
                          <option value="MS">Mato Grosso do Sul</option>
                          <option value="MG">Minas Gerais</option>
                          <option value="PA">Pará</option>
                          <option value="PB">Paraíba</option>
                          <option value="PR">Paraná</option>
                          <option value="PE">Pernambuco</option>
                          <option value="PI">Piauí</option>
                          <option value="RJ">Rio de Janeiro</option>
                          <option value="RN">Rio Grande do Norte</option>
                          <option value="RS">Rio Grande do Sul</option>
                          <option value="RO">Rondônia</option>
                          <option value="RR">Roraima</option>
                          <option value="SC">Santa Catarina</option>
                          <option value="SP">São Paulo</option>
                          <option value="SE">Sergipe</option>
                          <option value="TO">Tocantins</option>
                        </select>
                      </div>
                    </div>

                    {/* Campo para mudança de estágio */}
                    <div className="form-section-divider">
                      <h3>Mudança de Estágio</h3>
                      <p className="section-description">Atualizar estágio do visitante</p>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="novoEstagio">Novo Estágio</Label>
                        <select
                          id="novoEstagio"
                          name="novoEstagio"
                          value={formData.novoEstagio}
                          onChange={handleChange}
                          required
                          className="form-select"
                        >
                          <option value="">Selecione o novo estágio</option>
                          <option value="Novo Convertido">Novo Convertido</option>
                        </select>
                        <p className="field-hint">Estágio atual: {selectedVisitante.estagio_atual || 'Visitante'}</p>
                      </div>
                    </div>

                    <div className="form-actions">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleClearSelection}
                        className="cancel-button"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="submit-button"
                        disabled={loading}
                      >
                        {loading ? 'Integrando...' : 'Integrar Visitante'}
                      </Button>
                    </div>
                  </form>
                )}

                {!selectedVisitante && (
                  <div className="no-selection-message">
                    <p>Digite no campo de busca acima para localizar um visitante e preencher o formulário automaticamente.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="novo-convertido" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Cadastrar Novo Convertido</h2>
                
                <form onSubmit={handleNovoConvertidoSubmit} className="visitante-form">
                  {messageNovoConvertido.text && (
                    <div className={`form-message ${messageNovoConvertido.type}`}>
                      {messageNovoConvertido.text}
                    </div>
                  )}

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-recepcionadoPor">Recepcionado por</Label>
                      <Input
                        type="text"
                        id="novo-convertido-recepcionadoPor"
                        name="recepcionadoPor"
                        value={novoConvertidoFormData.recepcionadoPor}
                        readOnly
                        className="form-input form-input-readonly"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="novo-convertido-diaVisita">Dia da visita</Label>
                      <Input
                        type="datetime-local"
                        id="novo-convertido-diaVisita"
                        name="diaVisita"
                        value={novoConvertidoFormData.diaVisita}
                        onChange={handleNovoConvertidoChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-nomeCompleto">Nome completo *</Label>
                      <Input
                        type="text"
                        id="novo-convertido-nomeCompleto"
                        name="nomeCompleto"
                        value={novoConvertidoFormData.nomeCompleto}
                        onChange={handleNovoConvertidoChange}
                        placeholder="Digite o nome completo"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-dataNascimento">Data de nascimento</Label>
                      <Input
                        type="date"
                        id="novo-convertido-dataNascimento"
                        name="dataNascimento"
                        value={novoConvertidoFormData.dataNascimento}
                        onChange={handleNovoConvertidoChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="novo-convertido-whatsapp">WhatsApp</Label>
                      <Input
                        type="tel"
                        id="novo-convertido-whatsapp"
                        name="whatsapp"
                        value={novoConvertidoFormData.whatsapp}
                        onChange={handleNovoConvertidoChange}
                        placeholder="(00) 00000-0000"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-email">Email</Label>
                      <Input
                        type="email"
                        id="novo-convertido-email"
                        name="email"
                        value={novoConvertidoFormData.email}
                        onChange={handleNovoConvertidoChange}
                        placeholder="email@exemplo.com"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-bairro">Bairro *</Label>
                      <Input
                        type="text"
                        id="novo-convertido-bairro"
                        name="bairro"
                        value={novoConvertidoFormData.bairro}
                        onChange={handleNovoConvertidoChange}
                        placeholder="Digite o bairro"
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="novo-convertido-cidade">Cidade</Label>
                      <Input
                        type="text"
                        id="novo-convertido-cidade"
                        name="cidade"
                        value={novoConvertidoFormData.cidade}
                        onChange={handleNovoConvertidoChange}
                        placeholder="Digite a cidade"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-comoConheceu">Como Conheceu a IVN?</Label>
                      <select
                        id="novo-convertido-comoConheceu"
                        name="comoConheceu"
                        value={novoConvertidoFormData.comoConheceu}
                        onChange={handleNovoConvertidoChange}
                        className="form-select"
                      >
                        <option value="">Selecione uma opção (opcional)</option>
                        <option value="familia-amigo">Família/Amigo</option>
                        <option value="google">Google</option>
                        <option value="redesocial">Rede Social</option>
                        <option value="passei-frente">Passei em frente</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-pedidoOracao">Faça aqui seu pedido de oração</Label>
                      <textarea
                        id="novo-convertido-pedidoOracao"
                        name="pedidoOracao"
                        value={novoConvertidoFormData.pedidoOracao}
                        onChange={handleNovoConvertidoChange}
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
                      disabled={loadingNovoConvertido}
                    >
                      {loadingNovoConvertido ? 'Cadastrando...' : 'Cadastrar Novo Convertido'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="lista-novos-convertidos" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Lista de Novos Convertidos</h2>
                <NovosConvertidosTable />
              </div>
            </TabsContent>

            <TabsContent value="membresia" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Matrícula de Membresia</h2>
                
                {/* Campo de Pesquisa */}
                <div className="form-row" style={{ marginBottom: '24px' }}>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <Label htmlFor="membresia-search">Pesquisar Novo Convertido</Label>
                    <div className="search-input-wrapper">
                      <Search className="search-icon" />
                      <Input
                        type="text"
                        id="membresia-search"
                        placeholder="Digite o nome, email ou telefone..."
                        value={membresiaSearchQuery}
                        onChange={(e) => setMembresiaSearchQuery(e.target.value)}
                        className="form-input search-input"
                      />
                    </div>
                    {filteredNovosConvertidos.length > 0 && (
                      <div className="search-results-dropdown">
                        {filteredNovosConvertidos.map(nc => {
                          const nomeCompleto = nc.nomeCompleto || `${nc.nome || ''} ${nc.sobrenome || ''}`.trim();
                          return (
                            <div
                              key={nc.id}
                              className="search-result-item"
                              onClick={() => handleSelectNovoConvertido(nc)}
                            >
                              <div>
                                <strong>{nomeCompleto}</strong>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                  {nc.email || ''} {nc.email && nc.telefone ? '•' : ''} {nc.telefone || nc.whatsapp || ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Exibir selecionado */}
                {selectedNovoConvertido && (
                  <div className="selected-person-card" style={{ marginBottom: '24px' }}>
                    <div>
                      <strong>Novo Convertido Selecionado:</strong> {selectedNovoConvertido.nomeCompleto || `${selectedNovoConvertido.nome || ''} ${selectedNovoConvertido.sobrenome || ''}`.trim()}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearMembresiaSelection}
                      className="clear-selection-button"
                    >
                      Limpar Seleção
                    </Button>
                  </div>
                )}

                {/* Formulário de Matrícula */}
                {selectedNovoConvertido && (
                  <form onSubmit={handleMembresiaSubmit} className="visitante-form">
                    {messageMembresia.text && (
                      <div className={`form-message ${messageMembresia.type}`}>
                        {messageMembresia.text}
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="membresia-nomeCompleto">Nome Completo</Label>
                        <Input
                          type="text"
                          id="membresia-nomeCompleto"
                          name="nomeCompleto"
                          value={membresiaFormData.nomeCompleto}
                          onChange={handleMembresiaFormChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="membresia-email">Email</Label>
                        <Input
                          type="email"
                          id="membresia-email"
                          name="email"
                          value={membresiaFormData.email}
                          onChange={handleMembresiaFormChange}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <Label htmlFor="membresia-telefone">Telefone</Label>
                        <Input
                          type="tel"
                          id="membresia-telefone"
                          name="telefone"
                          value={membresiaFormData.telefone}
                          onChange={handleMembresiaFormChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="membresia-dataNascimento">Data de Nascimento</Label>
                        <Input
                          type="date"
                          id="membresia-dataNascimento"
                          name="dataNascimento"
                          value={membresiaFormData.dataNascimento}
                          onChange={handleMembresiaFormChange}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <Label htmlFor="membresia-dataMatricula">Data de Matrícula</Label>
                        <Input
                          type="date"
                          id="membresia-dataMatricula"
                          name="dataMatricula"
                          value={membresiaFormData.dataMatricula}
                          onChange={handleMembresiaFormChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <Button 
                        type="submit" 
                        className="submit-button"
                        disabled={loadingMembresia}
                      >
                        {loadingMembresia ? 'Matriculando...' : 'Realizar Matrícula'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Tabela de Alunos */}
                {alunosMembresia.length > 0 && (
                  <div style={{ marginTop: '48px' }}>
                    <h2 style={{ marginBottom: '24px' }}>Alunos de Membresia</h2>
                    <div className="table-wrapper">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Aluno</TableHead>
                            <TableHead style={{ textAlign: 'center' }}>Aula 1</TableHead>
                            <TableHead style={{ textAlign: 'center' }}>Aula 2</TableHead>
                            <TableHead style={{ textAlign: 'center' }}>Aula 3</TableHead>
                            <TableHead style={{ textAlign: 'center' }}>Aula 4</TableHead>
                            <TableHead style={{ textAlign: 'center' }}>Aula 5</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {alunosMembresia.map((aluno) => (
                            <TableRow key={aluno.id}>
                              <TableCell>
                                <div>
                                  <strong>{aluno.nomeCompleto || '-'}</strong>
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Matrícula: {aluno.dataMatricula ? (() => {
                                      try {
                                        const date = new Date(aluno.dataMatricula);
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString('pt-BR');
                                        }
                                        // Se não conseguir converter, tenta formatar manualmente
                                        if (typeof aluno.dataMatricula === 'string') {
                                          const dateStr = aluno.dataMatricula.split('T')[0];
                                          const [year, month, day] = dateStr.split('-');
                                          if (year && month && day) {
                                            return `${day}/${month}/${year}`;
                                          }
                                        }
                                        return aluno.dataMatricula;
                                      } catch (e) {
                                        return aluno.dataMatricula || '-';
                                      }
                                    })() : '-'}
                                  </div>
                                </div>
                              </TableCell>
                              {aluno.aulas.map((aula) => (
                                <TableCell key={aula.numero} style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <input
                                      type="checkbox"
                                      checked={aula.concluida}
                                      onChange={() => handleToggleAula(aluno.id, aula.numero)}
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer'
                                      }}
                                    />
                                    {aula.concluida && aula.dataConclusao && (
                                      <span style={{ fontSize: '10px', color: '#666' }}>
                                        {new Date(aula.dataConclusao).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {!selectedNovoConvertido && (
                  <div className="no-selection-message">
                    <p>Pesquise e selecione um novo convertido para realizar a matrícula de membresia.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="listar-membros" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Alunos Membresia</h2>
                <ListarMembros alunosMembresia={alunosMembresia} />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Análises e Estatísticas</h2>
                <Analytics />
              </div>
            </TabsContent>

            <TabsContent value="relatorios" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Relatório</h2>
                <RelatorioFormWrapper />
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

// Componente de Tabela de Novos Convertidos
const NovosConvertidosTable = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    dataVisita: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [novosConvertidos, setNovosConvertidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Carregar novos convertidos da API
  const loadNovosConvertidos = async () => {
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

      const response = await api.get('/integracao/novos-convertidos', { params });
      setNovosConvertidos(response.data.novosConvertidos || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Erro ao carregar novos convertidos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar novos convertidos. Tente novamente.',
        variant: 'destructive',
      });
      setNovosConvertidos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando filtros ou paginação mudarem
  useEffect(() => {
    loadNovosConvertidos();
  }, [currentPage, pageSize, filters.search, filters.dataVisita]);

  // Dados já vêm paginados da API, então filteredData = novosConvertidos
  const filteredData = novosConvertidos;

  // Paginação - já vem paginado da API
  const totalPages = Math.ceil(total / pageSize);
  const paginatedData = filteredData;

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

  // Páginas para exibição
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

  return (
    <div className="visitantes-table-container">
      {/* Área de Filtros */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <Label htmlFor="search-novos-convertidos">Buscar</Label>
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <Input
                type="text"
                id="search-novos-convertidos"
                placeholder="Nome, email ou WhatsApp..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <Label htmlFor="dataVisita-novos-convertidos">Data da Visita</Label>
            <Input
              type="date"
              id="dataVisita-novos-convertidos"
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Nenhum novo convertido encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((novoConvertido) => (
                <TableRow key={novoConvertido.id}>
                  <TableCell>{novoConvertido.recepcionadoPor || '-'}</TableCell>
                  <TableCell>{novoConvertido.primeiraVisita ? formatDate(novoConvertido.primeiraVisita) : '-'}</TableCell>
                  <TableCell>{novoConvertido.nomeCompleto || `${novoConvertido.nome} ${novoConvertido.sobrenome || ''}`.trim()}</TableCell>
                  <TableCell>{novoConvertido.dataNascimento ? formatDate(novoConvertido.dataNascimento) : '-'}</TableCell>
                  <TableCell>{novoConvertido.whatsapp || novoConvertido.telefone || '-'}</TableCell>
                  <TableCell>{novoConvertido.email || '-'}</TableCell>
                  <TableCell>{novoConvertido.bairro || '-'}</TableCell>
                  <TableCell>{novoConvertido.cidade || '-'}</TableCell>
                  <TableCell>{novoConvertido.comoConheceu || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {total > 0 && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, total)} de {total} novos convertidos
            </span>
            <div className="page-size-selector">
              <Label htmlFor="pageSize-novos-convertidos">Linhas por página:</Label>
              <select
                id="pageSize-novos-convertidos"
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
    </div>
  );
};

// Componente de Listagem de Membros
const ListarMembros = ({ alunosMembresia }) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    dataMatricula: '',
    aulasConcluidas: '',
    aulasNaoFeitas: '',
    estagio: 'Aluno' // Default: Aluno
  });
  const [loadingTornarMembro, setLoadingTornarMembro] = useState({});
  const [tornarMembroDialogOpen, setTornarMembroDialogOpen] = useState(false);
  const [alunoParaTornarMembro, setAlunoParaTornarMembro] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtrar dados
  const filteredData = useMemo(() => {
    return alunosMembresia.filter(aluno => {
      // Filtro por estágio (Aluno = "Em Membresia", Membro = "Membro")
      const estagioAtual = aluno.estagioAtual || 'Em Membresia';
      let matchEstagio = true;
      if (filters.estagio === 'Aluno') {
        matchEstagio = estagioAtual === 'Em Membresia';
      } else if (filters.estagio === 'Membro') {
        matchEstagio = estagioAtual === 'Membro';
      }
      
      // Filtro por nome
      const matchSearch = !filters.search || 
        aluno.nomeCompleto.toLowerCase().includes(filters.search.toLowerCase()) ||
        aluno.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        aluno.telefone.includes(filters.search);
      
      // Filtro por data de matrícula
      const matchData = !filters.dataMatricula || 
        aluno.dataMatricula === filters.dataMatricula;
      
      // Filtro por aulas concluídas
      const aulasConcluidasCount = aluno.aulas.filter(a => a.concluida).length;
      let matchAulasConcluidas = true;
      if (filters.aulasConcluidas) {
        const minConcluidas = parseInt(filters.aulasConcluidas);
        matchAulasConcluidas = aulasConcluidasCount >= minConcluidas;
      }
      
      // Filtro por aulas não feitas
      const aulasNaoFeitasCount = aluno.aulas.filter(a => !a.concluida).length;
      let matchAulasNaoFeitas = true;
      if (filters.aulasNaoFeitas) {
        const minNaoFeitas = parseInt(filters.aulasNaoFeitas);
        matchAulasNaoFeitas = aulasNaoFeitasCount >= minNaoFeitas;
      }
      
      return matchEstagio && matchSearch && matchData && matchAulasConcluidas && matchAulasNaoFeitas;
    });
  }, [alunosMembresia, filters]);

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
    return date.toLocaleDateString('pt-BR');
  };

  // Contar aulas concluídas e não feitas
  const getAulasConcluidas = (aluno) => {
    return aluno.aulas.filter(a => a.concluida).length;
  };

  const getAulasNaoFeitas = (aluno) => {
    return aluno.aulas.filter(a => !a.concluida).length;
  };

  // Abrir dialog de confirmação para tornar membro
  const handleTornarMembroClick = (aluno) => {
    if (!aluno.pessoaId) {
      toast({
        title: 'Erro',
        description: 'ID da pessoa não encontrado.',
        variant: 'destructive',
      });
      return;
    }
    setAlunoParaTornarMembro(aluno);
    setTornarMembroDialogOpen(true);
  };

  // Função para tornar membro (após confirmação)
  const handleConfirmTornarMembro = async () => {
    if (!alunoParaTornarMembro || !alunoParaTornarMembro.pessoaId) {
      toast({
        title: 'Erro',
        description: 'ID da pessoa não encontrado.',
        variant: 'destructive',
      });
      setTornarMembroDialogOpen(false);
      return;
    }

    setLoadingTornarMembro(prev => ({ ...prev, [alunoParaTornarMembro.id]: true }));

    try {
      // Buscar dados da pessoa primeiro
      const pessoaResponse = await api.get(`/pessoas/${alunoParaTornarMembro.pessoaId}`);
      const pessoa = pessoaResponse.data.pessoa || pessoaResponse.data;

      // Extrair nome e sobrenome
      let nome = pessoa.nome;
      let sobrenome = pessoa.sobrenome;

      // Se não tiver nome/sobrenome, tentar extrair do nomeCompleto do aluno
      if (!nome || !nome.trim() || !sobrenome || !sobrenome.trim()) {
        if (alunoParaTornarMembro.nomeCompleto) {
          const partesNome = alunoParaTornarMembro.nomeCompleto.trim().split(/\s+/);
          if (partesNome.length > 0) {
            nome = nome || partesNome[0] || '';
            sobrenome = sobrenome || partesNome.slice(1).join(' ') || '';
          }
        }
      }

      // Verificar se nome existe (obrigatório)
      if (!nome || !nome.trim()) {
        throw new Error('Nome é obrigatório para promover a membro. Por favor, verifique os dados da pessoa.');
      }
      
      // Verificar se sobrenome existe (obrigatório pelo backend)
      if (!sobrenome || !sobrenome.trim()) {
        // Se ainda não tiver sobrenome, tentar usar o nome completo como sobrenome
        // ou usar um valor padrão
        if (alunoParaTornarMembro.nomeCompleto && alunoParaTornarMembro.nomeCompleto.trim()) {
          const partesNome = alunoParaTornarMembro.nomeCompleto.trim().split(/\s+/);
          if (partesNome.length > 1) {
            sobrenome = partesNome.slice(1).join(' ');
          } else {
            // Se não tiver sobrenome, usar o próprio nome como sobrenome (fallback)
            sobrenome = nome;
          }
        } else {
          // Último recurso: usar o nome como sobrenome
          sobrenome = nome;
        }
      }

      // Integrar visitante mudando estágio para "Membro"
      await api.post('/integracao/integrar-visitante', {
        pessoaId: alunoParaTornarMembro.pessoaId,
        novoEstagio: 'Membro',
        observacoes: 'Promovido a membro após conclusão do curso de membresia',
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: pessoa.email || null,
        telefone: pessoa.telefone || null,
        dataNascimento: pessoa.dataNascimento || null,
        sexo: pessoa.sexo || null,
        estadoCivil: pessoa.estadoCivil || null,
        cep: pessoa.cep || null,
        rua: pessoa.rua || null,
        numero: pessoa.numero || null,
        complemento: pessoa.complemento || null,
        bairro: pessoa.bairro || null,
        cidade: pessoa.cidade || null,
        estado: pessoa.estado || null
      });

      toast({
        title: 'Sucesso',
        description: `${alunoParaTornarMembro.nomeCompleto} foi promovido a membro com sucesso!`,
      });

      setTornarMembroDialogOpen(false);
      setAlunoParaTornarMembro(null);
      
      // Recarregar matrículas para atualizar o estágio
      window.location.reload();
    } catch (error) {
      console.error('Erro ao tornar membro:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || error.message || 'Erro ao promover a membro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTornarMembro(prev => ({ ...prev, [alunoParaTornarMembro.id]: false }));
    }
  };

  // Função para reverter membro (voltar para "Em Membresia")
  const handleReverterMembro = async () => {
    if (!alunoParaTornarMembro || !alunoParaTornarMembro.pessoaId) {
      toast({
        title: 'Erro',
        description: 'ID da pessoa não encontrado.',
        variant: 'destructive',
      });
      setTornarMembroDialogOpen(false);
      return;
    }

    setLoadingTornarMembro(prev => ({ ...prev, [alunoParaTornarMembro.id]: true }));

    try {
      // Buscar dados da pessoa primeiro
      const pessoaResponse = await api.get(`/pessoas/${alunoParaTornarMembro.pessoaId}`);
      const pessoa = pessoaResponse.data.pessoa || pessoaResponse.data;

      // Extrair nome e sobrenome
      let nome = pessoa.nome;
      let sobrenome = pessoa.sobrenome;

      // Se não tiver nome/sobrenome, tentar extrair do nomeCompleto do aluno
      if (!nome || !nome.trim() || !sobrenome || !sobrenome.trim()) {
        if (alunoParaTornarMembro.nomeCompleto) {
          const partesNome = alunoParaTornarMembro.nomeCompleto.trim().split(/\s+/);
          if (partesNome.length > 0) {
            nome = nome || partesNome[0] || '';
            sobrenome = sobrenome || partesNome.slice(1).join(' ') || '';
          }
        }
      }

      // Verificar se nome existe (obrigatório)
      if (!nome || !nome.trim()) {
        throw new Error('Nome é obrigatório para reverter membro. Por favor, verifique os dados da pessoa.');
      }
      
      // Verificar se sobrenome existe (obrigatório pelo backend)
      if (!sobrenome || !sobrenome.trim()) {
        if (alunoParaTornarMembro.nomeCompleto && alunoParaTornarMembro.nomeCompleto.trim()) {
          const partesNome = alunoParaTornarMembro.nomeCompleto.trim().split(/\s+/);
          if (partesNome.length > 1) {
            sobrenome = partesNome.slice(1).join(' ');
          } else {
            sobrenome = nome;
          }
        } else {
          sobrenome = nome;
        }
      }

      // Integrar visitante mudando estágio de "Membro" para "Em Membresia"
      await api.post('/integracao/integrar-visitante', {
        pessoaId: alunoParaTornarMembro.pessoaId,
        novoEstagio: 'Em Membresia',
        observacoes: 'Revertido de membro para aluno de membresia',
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: pessoa.email || null,
        telefone: pessoa.telefone || null,
        dataNascimento: pessoa.dataNascimento || null,
        sexo: pessoa.sexo || null,
        estadoCivil: pessoa.estadoCivil || null,
        cep: pessoa.cep || null,
        rua: pessoa.rua || null,
        numero: pessoa.numero || null,
        complemento: pessoa.complemento || null,
        bairro: pessoa.bairro || null,
        cidade: pessoa.cidade || null,
        estado: pessoa.estado || null
      });

      toast({
        title: 'Sucesso',
        description: `${alunoParaTornarMembro.nomeCompleto} foi revertido para aluno de membresia com sucesso!`,
      });

      setTornarMembroDialogOpen(false);
      setAlunoParaTornarMembro(null);
      
      // Recarregar matrículas para atualizar o estágio
      window.location.reload();
    } catch (error) {
      console.error('Erro ao reverter membro:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || error.message || 'Erro ao reverter membro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTornarMembro(prev => ({ ...prev, [alunoParaTornarMembro.id]: false }));
    }
  };

  // Páginas para exibição
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

  return (
    <div className="visitantes-table-container">
      {/* Área de Filtros */}
      <div className="filters-section">
        <div className="filters-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: '16px' }}>
          <div className="filter-group">
            <Label htmlFor="estagio-membros">Estágio</Label>
            <select
              id="estagio-membros"
              value={filters.estagio}
              onChange={(e) => handleFilterChange('estagio', e.target.value)}
              className="form-select"
            >
              <option value="Aluno">Aluno</option>
              <option value="Membro">Membro</option>
            </select>
          </div>

          <div className="filter-group">
            <Label htmlFor="search-membros">Buscar</Label>
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <Input
                type="text"
                id="search-membros"
                placeholder="Nome, email ou telefone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <Label htmlFor="dataMatricula-membros">Data Matrícula</Label>
            <Input
              type="date"
              id="dataMatricula-membros"
              value={filters.dataMatricula}
              onChange={(e) => handleFilterChange('dataMatricula', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <Label htmlFor="aulasConcluidas-membros">Mín. Aulas Concluídas</Label>
            <select
              id="aulasConcluidas-membros"
              value={filters.aulasConcluidas}
              onChange={(e) => handleFilterChange('aulasConcluidas', e.target.value)}
              className="form-select"
            >
              <option value="">Todas</option>
              <option value="1">1 ou mais</option>
              <option value="2">2 ou mais</option>
              <option value="3">3 ou mais</option>
              <option value="4">4 ou mais</option>
              <option value="5">5 (todas)</option>
            </select>
          </div>

          <div className="filter-group">
            <Label htmlFor="aulasNaoFeitas-membros">Mín. Aulas Não Feitas</Label>
            <select
              id="aulasNaoFeitas-membros"
              value={filters.aulasNaoFeitas}
              onChange={(e) => handleFilterChange('aulasNaoFeitas', e.target.value)}
              className="form-select"
            >
              <option value="">Todas</option>
              <option value="1">1 ou mais</option>
              <option value="2">2 ou mais</option>
              <option value="3">3 ou mais</option>
              <option value="4">4 ou mais</option>
              <option value="5">5 (todas)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Aluno</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Data Matrícula</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aulas Concluídas</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aulas Não Feitas</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Progresso</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 1</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 2</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 3</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 4</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 5</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center">
                  {alunosMembresia.length === 0 
                    ? 'Nenhum aluno de membresia cadastrado ainda.' 
                    : 'Nenhum aluno encontrado com os filtros aplicados.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((aluno) => {
                const aulasConcluidas = getAulasConcluidas(aluno);
                const aulasNaoFeitas = getAulasNaoFeitas(aluno);
                const progresso = Math.round((aulasConcluidas / 5) * 100);
                
                return (
                  <TableRow key={aluno.id}>
                    <TableCell>
                      <strong>{aluno.nomeCompleto}</strong>
                    </TableCell>
                    <TableCell>{aluno.email || '-'}</TableCell>
                    <TableCell>{aluno.telefone || '-'}</TableCell>
                    <TableCell>{formatDate(aluno.dataMatricula)}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <span style={{ 
                        color: '#22c55e', 
                        fontWeight: '600' 
                      }}>
                        {aulasConcluidas}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <span style={{ 
                        color: '#ef4444', 
                        fontWeight: '600' 
                      }}>
                        {aulasNaoFeitas}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progresso}%`,
                            height: '100%',
                            backgroundColor: progresso === 100 ? '#22c55e' : progresso >= 50 ? '#3b82f6' : '#f59e0b',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {progresso}%
                        </span>
                      </div>
                    </TableCell>
                    {aluno.aulas.map((aula) => (
                      <TableCell key={aula.numero} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            backgroundColor: aula.concluida ? '#22c55e' : '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {aula.concluida ? '✓' : ''}
                          </div>
                          {aula.concluida && aula.dataConclusao && (
                            <span style={{ fontSize: '10px', color: '#666' }}>
                              {formatDate(aula.dataConclusao)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell style={{ textAlign: 'center' }}>
                      {aluno.estagioAtual === 'Membro' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTornarMembroClick(aluno)}
                          disabled={loadingTornarMembro[aluno.id]}
                          style={{
                            minWidth: '120px',
                            backgroundColor: '#fef2f2',
                            borderColor: '#fecaca',
                            color: '#dc2626'
                          }}
                        >
                          {loadingTornarMembro[aluno.id] ? 'Processando...' : 'Reverter'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTornarMembroClick(aluno)}
                          disabled={loadingTornarMembro[aluno.id]}
                          style={{
                            minWidth: '120px'
                          }}
                        >
                          {loadingTornarMembro[aluno.id] ? 'Processando...' : 'Tornar Membro'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {filteredData.length > pageSize && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} membros
            </span>
            <div className="page-size-selector">
              <Label htmlFor="pageSize-membros">Linhas por página:</Label>
              <select
                id="pageSize-membros"
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

      {/* Dialog de confirmação para tornar/reverter membro */}
      <AlertDialog open={tornarMembroDialogOpen} onOpenChange={setTornarMembroDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alunoParaTornarMembro?.estagioAtual === 'Membro' 
                ? 'Confirmar reversão para aluno' 
                : 'Confirmar promoção a membro'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alunoParaTornarMembro?.estagioAtual === 'Membro' ? (
                <>
                  Tem certeza que deseja reverter <strong>{alunoParaTornarMembro?.nomeCompleto || 'este membro'}</strong> para aluno de membresia? 
                  Esta ação alterará o estágio espiritual da pessoa de "Membro" para "Em Membresia".
                </>
              ) : (
                <>
                  Tem certeza que deseja promover <strong>{alunoParaTornarMembro?.nomeCompleto || 'este aluno'}</strong> a membro? 
                  Esta ação alterará o estágio espiritual da pessoa para "Membro".
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setTornarMembroDialogOpen(false);
              setAlunoParaTornarMembro(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={alunoParaTornarMembro?.estagioAtual === 'Membro' ? handleReverterMembro : handleConfirmTornarMembro}
              disabled={loadingTornarMembro[alunoParaTornarMembro?.id]}
              className={alunoParaTornarMembro?.estagioAtual === 'Membro' 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {loadingTornarMembro[alunoParaTornarMembro?.id] ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Componente de Analytics
const Analytics = () => {
  const { toast } = useToast();
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [periodoFiltro, setPeriodoFiltro] = useState({
    dataInicio: primeiroDiaMes.toISOString().split('T')[0],
    dataFim: ultimoDiaMes.toISOString().split('T')[0]
  });

  const [estatisticas, setEstatisticas] = useState({
    totalNovosConvertidos: 0,
    totalAlunosMembresia: 0,
    alunosComTodasAulas: 0,
    alunosComAlgumaAula: 0,
    alunosSemAulas: 0,
    totalAulasConcluidas: 0,
    totalAulasNaoConcluidas: 0,
    taxaConclusao: 0,
    topCidades: [],
    alunosPorProgresso: {
      completo: 0,
      parcial: 0,
      nenhum: 0
    },
    porMes: []
  });

  const [loading, setLoading] = useState(false);

  // Carregar estatísticas da API
  const loadEstatisticas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (periodoFiltro.dataInicio) {
        params.dataInicio = periodoFiltro.dataInicio;
      }
      if (periodoFiltro.dataFim) {
        params.dataFim = periodoFiltro.dataFim;
      }

      const response = await api.get('/integracao/analytics', { params });
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar estatísticas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas quando o período mudar
  useEffect(() => {
    loadEstatisticas();
  }, [periodoFiltro.dataInicio, periodoFiltro.dataFim]);

  const handlePeriodoChange = (name, value) => {
    setPeriodoFiltro(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Filtro de Período */}
      <div className="filters-section" style={{ marginBottom: '32px' }}>
        <div className="filters-row" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '600px' }}>
          <div className="filter-group">
            <Label htmlFor="dataInicio-analytics">Data Início</Label>
            <Input
              type="date"
              id="dataInicio-analytics"
              value={periodoFiltro.dataInicio}
              onChange={(e) => handlePeriodoChange('dataInicio', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <Label htmlFor="dataFim-analytics">Data Fim</Label>
            <Input
              type="date"
              id="dataFim-analytics"
              value={periodoFiltro.dataFim}
              onChange={(e) => handlePeriodoChange('dataFim', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="estatisticas-summary" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Novos Convertidos</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#3b82f6' }}>
              {estatisticas.totalNovosConvertidos}
            </div>
            <div className="stat-label">Total no Período</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Alunos de Membresia</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#10b981' }}>
              {estatisticas.totalAlunosMembresia}
            </div>
            <div className="stat-label">Total no Período</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Aulas Concluídas</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#22c55e' }}>
              {estatisticas.totalAulasConcluidas}
            </div>
            <div className="stat-label">de {estatisticas.totalAlunosMembresia * 5} possíveis</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              {estatisticas.taxaConclusao}%
            </div>
            <div className="stat-label">Percentual de Aulas</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Alunos Completos</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#8b5cf6' }}>
              {estatisticas.alunosComTodasAulas}
            </div>
            <div className="stat-label">Todas as 5 aulas concluídas</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Alunos em Progresso</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#06b6d4' }}>
              {estatisticas.alunosComAlgumaAula - estatisticas.alunosComTodasAulas}
            </div>
            <div className="stat-label">Com alguma aula concluída</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Estatísticas Detalhadas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Progresso dos Alunos */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Completos (5 aulas)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '200px',
                    height: '20px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${estatisticas.totalAlunosMembresia > 0 ? (estatisticas.alunosPorProgresso.completo / estatisticas.totalAlunosMembresia) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#8b5cf6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <strong>{estatisticas.alunosPorProgresso.completo}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Parcial (1-4 aulas)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '200px',
                    height: '20px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${estatisticas.totalAlunosMembresia > 0 ? (estatisticas.alunosPorProgresso.parcial / estatisticas.totalAlunosMembresia) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#06b6d4',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <strong>{estatisticas.alunosPorProgresso.parcial}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Nenhuma aula</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '200px',
                    height: '20px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${estatisticas.totalAlunosMembresia > 0 ? (estatisticas.alunosPorProgresso.nenhum / estatisticas.totalAlunosMembresia) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#ef4444',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <strong>{estatisticas.alunosPorProgresso.nenhum}</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Cidades */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {estatisticas.topCidades.length > 0 ? (
                estatisticas.topCidades.map((item, index) => (
                  <div key={item.cidade} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                      <span>{item.cidade}</span>
                    </div>
                    <strong>{item.quantidade} alunos</strong>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', textAlign: 'center' }}>Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Matrículas por Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Matrículas por Mês (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', padding: '20px 0' }}>
            {estatisticas.porMes.map((item, index) => {
              const maxQuantidade = Math.max(...estatisticas.porMes.map(m => m.quantidade), 1);
              const altura = (item.quantidade / maxQuantidade) * 100;
              
              return (
                <div key={index} style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '100%',
                    height: `${altura}%`,
                    backgroundColor: '#3b82f6',
                    borderRadius: '4px 4px 0 0',
                    minHeight: item.quantidade > 0 ? '20px' : '0',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '4px'
                  }}>
                    {item.quantidade > 0 && item.quantidade}
                  </div>
                  <span style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                    {item.mes}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente Wrapper para Relatório (gerencia estado de edição)
const RelatorioFormWrapper = () => {
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveSuccess = () => {
    setEditingId(null);
    setRefreshKey(prev => prev + 1); // Força atualização da lista
  };

  return (
    <>
      <RelatorioForm 
        editingId={editingId} 
        onCancelEdit={handleCancelEdit}
        onSaveSuccess={handleSaveSuccess}
      />
      <div className="relatorios-section">
        <RelatoriosGerados onEdit={handleEdit} refreshKey={refreshKey} />
      </div>
    </>
  );
};

// Componente de Formulário de Relatório
const RelatorioForm = ({ editingId, onCancelEdit, onSaveSuccess }) => {
  const meses = useMemo(() => [
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
  ], []);

  const mesAtual = useMemo(() => String(new Date().getMonth() + 1).padStart(2, '0'), []);

  const [formData, setFormData] = useState({
    nomeMinisterio: 'Ministério Integração',
    mesReferencia: mesAtual,
    conteudo: ''
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  // Carregar relatório quando editingId mudar
  useEffect(() => {
    if (editingId) {
      const carregarRelatorio = async () => {
        setLoadingRelatorio(true);
        try {
          const response = await api.get(`/relatorios/${editingId}`);
          const relatorio = response.data.relatorio;
          
          // Converter nome do mês para número
          const mesEncontrado = meses.find(m => m.label === relatorio.mesReferencia);
          const mesValue = mesEncontrado ? mesEncontrado.value : mesAtual;
          
          setFormData({
            nomeMinisterio: relatorio.nomeMinisterio,
            mesReferencia: mesValue,
            conteudo: relatorio.conteudo
          });
        } catch (error) {
          toast({
            title: 'Erro',
            description: 'Erro ao carregar relatório. Tente novamente.',
            variant: 'destructive',
          });
          if (onCancelEdit) onCancelEdit();
        } finally {
          setLoadingRelatorio(false);
        }
      };

      carregarRelatorio();
    } else {
      // Resetar formulário quando não estiver editando
      setFormData({
        nomeMinisterio: 'Ministério Integração',
        mesReferencia: mesAtual,
        conteudo: ''
      });
    }
  }, [editingId, mesAtual, meses, onCancelEdit, toast]);

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

    try {
      if (editingId) {
        // Atualizar relatório existente
        await api.put(`/relatorios/${editingId}`, formData);
        
        toast({
          title: 'Sucesso!',
          description: 'Relatório atualizado com sucesso!',
        });
        
        onSaveSuccess();
      } else {
        // Criar novo relatório
        await api.post('/relatorios', formData);
        
        toast({
          title: 'Sucesso!',
          description: 'Relatório criado com sucesso!',
        });

        setFormData({
          nomeMinisterio: 'Ministério Integração',
          mesReferencia: mesAtual,
          conteudo: ''
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (editingId ? 'Erro ao atualizar relatório. Tente novamente.' : 'Erro ao criar relatório. Tente novamente.');
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
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
  ];

  if (loadingRelatorio) {
    return <div className="text-center p-8">Carregando relatório...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="relatorio-form">
      {editingId && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Modo de Edição:</strong> Você está editando um relatório existente.
          </p>
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
        {editingId && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancelEdit}
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
            ? (editingId ? 'Atualizando...' : 'Enviando...') 
            : (editingId ? 'Atualizar Relatório' : 'Enviar Relatório')
          }
        </Button>
      </div>
    </form>
  );
};

// Componente de Lista de Relatórios Gerados
const RelatoriosGerados = ({ onEdit, refreshKey }) => {
  const { toast } = useToast();
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarRelatorios = async () => {
      setLoading(true);
      try {
        const response = await api.get('/relatorios', {
          params: {
            nomeMinisterio: 'Ministério Integração'
          }
        });
        setRelatorios(response.data.relatorios);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar relatórios. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    buscarRelatorios();
  }, [toast, refreshKey]);

  const handleDownload = async (relatorio) => {
    try {
      const response = await api.get(`/relatorios/${relatorio.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_${relatorio.nomeMinisterio}_${relatorio.mesReferencia}_${relatorio.anoReferencia}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: 'Sucesso!',
        description: 'Relatório baixado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relatorios-gerados-container">
      <h3 className="relatorios-gerados-title">Relatórios Gerados</h3>
      
      {loading ? (
        <div className="text-center p-8">Carregando relatórios...</div>
      ) : relatorios.length === 0 ? (
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit && onEdit(relatorio.id)}
                    className="relatorio-edit-button"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(relatorio)}
                    className="relatorio-download-button"
                  >
                    <Download className="download-icon" />
                    <span>Download</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Integracao;
