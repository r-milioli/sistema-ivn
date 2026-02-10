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
import { Search, UserPlus, Camera, X, Heart, List, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
    podeIncluirGrupoWhatsapp: '',
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
      podeIncluirGrupoWhatsapp: pessoa.podeIncluirGrupoWhatsapp === true ? 'sim' : pessoa.podeIncluirGrupoWhatsapp === false ? 'nao' : '',
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
      podeIncluirGrupoWhatsapp: '',
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

      // Preparar payload: enviar todos os campos do formulário (backend usa COALESCE para não apagar com vazio)
      const opt = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
      await api.post('/integracao/integrar-visitante', {
        pessoaId: selectedVisitante.id,
        novoEstagio: formData.novoEstagio,
        observacoes: `Integração realizada via sistema`,
        nome: (formData.nome || '').trim(),
        sobrenome: (formData.sobrenome || '').trim(),
        podeIncluirGrupoWhatsapp: formData.podeIncluirGrupoWhatsapp === 'sim' ? true : formData.podeIncluirGrupoWhatsapp === 'nao' ? false : null,
        email: opt(formData.email),
        telefone: opt(formData.telefone),
        dataNascimento: opt(formData.dataNascimento),
        sexo: opt(formData.sexo),
        estadoCivil: opt(formData.estadoCivil),
        cep: opt(formData.cep),
        rua: opt(formData.rua),
        numero: opt(formData.numero),
        complemento: opt(formData.complemento),
        bairro: opt(formData.bairro),
        cidade: opt(formData.cidade),
        estado: opt(formData.estado),
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
              <TabsTrigger value="analytics" className="integracao-tabs-trigger">
                <BarChart3 className="tab-icon" />
                <span>Analytics</span>
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

                    <div className="form-row form-row-2">
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
                      <div className="form-group">
                        <Label htmlFor="podeIncluirGrupoWhatsapp">Pode incluir no grupo de WhatsApp</Label>
                        <select
                          id="podeIncluirGrupoWhatsapp"
                          name="podeIncluirGrupoWhatsapp"
                          value={formData.podeIncluirGrupoWhatsapp}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="">Selecione (opcional)</option>
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
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

            <TabsContent value="analytics" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Análises e Estatísticas</h2>
                <Analytics />
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
    topBairros: [],
    alunosPorProgresso: {
      completo: 0,
      parcial: 0,
      nenhum: 0
    },
    porMes: [],
    totalAlunosBatismo: 0,
    totalAulasBatismoConcluidas: 0,
    alunosBatismoCompletos: 0,
    alunosBatismoAlgumaAula: 0,
    alunosBatismoSemAulas: 0,
    taxaConclusaoBatismo: 0,
    porMesBatismo: [],
    alunosBatismoPorProgresso: {
      completo: 0,
      parcial: 0,
      nenhum: 0
    }
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

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Alunos de Batismo</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#0ea5e9' }}>
              {estatisticas.totalAlunosBatismo || 0}
            </div>
            <div className="stat-label">Total no Período</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Aulas Batismo Concluídas</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#0284c7' }}>
              {estatisticas.totalAulasBatismoConcluidas || 0}
            </div>
            <div className="stat-label">de {(estatisticas.totalAlunosBatismo || 0) * 5} possíveis</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Taxa Conclusão Batismo</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#0891b2' }}>
              {estatisticas.taxaConclusaoBatismo || 0}%
            </div>
            <div className="stat-label">Percentual do Curso</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Batismo Completos</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value" style={{ color: '#0369a1' }}>
              {estatisticas.alunosBatismoCompletos || 0}
            </div>
            <div className="stat-label">5 aulas concluídas</div>
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

        {/* Top Bairros */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Bairros</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {estatisticas.topBairros?.length > 0 ? (
                estatisticas.topBairros.map((item, index) => (
                  <div key={item.bairro} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      <span>{item.bairro}</span>
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

        {/* Progresso dos Alunos de Batismo */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Alunos de Batismo</CardTitle>
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
                      width: `${(estatisticas.totalAlunosBatismo || 0) > 0 && estatisticas.alunosBatismoPorProgresso ? (estatisticas.alunosBatismoPorProgresso.completo / estatisticas.totalAlunosBatismo) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#0369a1',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <strong>{estatisticas.alunosBatismoPorProgresso?.completo || 0}</strong>
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
                      width: `${(estatisticas.totalAlunosBatismo || 0) > 0 && estatisticas.alunosBatismoPorProgresso ? (estatisticas.alunosBatismoPorProgresso.parcial / estatisticas.totalAlunosBatismo) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#0891b2',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <strong>{estatisticas.alunosBatismoPorProgresso?.parcial || 0}</strong>
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
                      width: `${(estatisticas.totalAlunosBatismo || 0) > 0 && estatisticas.alunosBatismoPorProgresso ? (estatisticas.alunosBatismoPorProgresso.nenhum / estatisticas.totalAlunosBatismo) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#ef4444',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <strong>{estatisticas.alunosBatismoPorProgresso?.nenhum || 0}</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Matrículas por Mês */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
      <Card>
        <CardHeader>
          <CardTitle>Matrículas Membresia por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', padding: '20px 0' }}>
            {(estatisticas.porMes || []).map((item, index) => {
              const porMesArr = estatisticas.porMes || [];
              const maxQuantidade = porMesArr.length > 0 ? Math.max(...porMesArr.map(m => m.quantidade), 1) : 1;
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

      <Card>
        <CardHeader>
          <CardTitle>Matrículas Batismo por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', padding: '20px 0' }}>
            {(estatisticas.porMesBatismo || []).map((item, index) => {
              const porMesBatismoArr = estatisticas.porMesBatismo || [];
              const maxQuantidade = porMesBatismoArr.length > 0 ? Math.max(...porMesBatismoArr.map(m => m.quantidade), 1) : 1;
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
                    backgroundColor: '#0ea5e9',
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
    </div>
  );
};

export default Integracao;
