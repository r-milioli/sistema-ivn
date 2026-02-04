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
import { Search, UserPlus, Camera, X, Heart, List, ChevronLeft, ChevronRight, GraduationCap, Users, BarChart3, TrendingUp, Calendar, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../context/AuthContext';
import './Integracao.css';

const Integracao = () => {
  const { user } = useAuth();
  // Estados para pesquisa
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitante, setSelectedVisitante] = useState(null);

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

  // Filtrar visitantes
  const filteredVisitantes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return visitantes.filter(visitante => {
      const nomeCompleto = `${visitante.nome} ${visitante.sobrenome}`.toLowerCase();
      const email = visitante.email?.toLowerCase() || '';
      const telefone = visitante.telefone?.replace(/\D/g, '') || '';
      const searchQueryClean = query.replace(/\D/g, '');
      
      return nomeCompleto.includes(query) ||
             email.includes(query) ||
             telefone.includes(searchQueryClean);
    });
  }, [searchQuery, visitantes]);

  // Preencher formulário quando visitante for selecionado
  const handleSelectVisitante = (visitante) => {
    setSelectedVisitante(visitante);
    setFormData({
      nome: visitante.nome || '',
      sobrenome: visitante.sobrenome || '',
      email: visitante.email || '',
      telefone: visitante.telefone || '',
      dataNascimento: visitante.dataNascimento || '',
      sexo: visitante.sexo || '',
      estadoCivil: visitante.estadoCivil || '',
      cep: visitante.cep || '',
      rua: visitante.rua || '',
      numero: visitante.numero || '',
      complemento: visitante.complemento || '',
      bairro: visitante.bairro || '',
      cidade: visitante.cidade || '',
      estado: visitante.estado || '',
      novoEstagio: '',
      fotoPerfil: null
    });
    setFotoPerfilPreview(visitante.fotoPerfil || null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!selectedVisitante) {
      setMessage({ type: 'error', text: 'Por favor, selecione um visitante para integrar.' });
      setLoading(false);
      return;
    }

    if (!formData.novoEstagio) {
      setMessage({ type: 'error', text: 'Por favor, selecione o novo estágio do usuário.' });
      setLoading(false);
      return;
    }

    try {
      // Simulação de integração - TODO: Substituir por chamada real à API
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Visitante integrado com sucesso!' });
        setLoading(false);
        // Limpar formulário após sucesso
        handleClearSelection();
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao integrar visitante. Tente novamente.' });
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

    try {
      // Simulação de criação - TODO: Substituir por chamada real à API
      // O estágio será automaticamente definido como "Novo Convertido"
      setTimeout(() => {
        setMessageNovoConvertido({ type: 'success', text: 'Novo convertido cadastrado com sucesso!' });
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
        setLoadingNovoConvertido(false);
      }, 1000);
    } catch (error) {
      setMessageNovoConvertido({ type: 'error', text: 'Erro ao cadastrar novo convertido. Tente novamente.' });
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
    endereco: '',
    cidade: '',
    dataMatricula: new Date().toISOString().split('T')[0]
  });
  const [alunosMembresia, setAlunosMembresia] = useState([]);
  const [loadingMembresia, setLoadingMembresia] = useState(false);
  const [messageMembresia, setMessageMembresia] = useState({ type: '', text: '' });

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

  // Filtrar novos convertidos para pesquisa
  const filteredNovosConvertidos = useMemo(() => {
    if (!membresiaSearchQuery.trim()) return [];
    return mockNovosConvertidosParaMembresia.filter(nc =>
      nc.nomeCompleto.toLowerCase().includes(membresiaSearchQuery.toLowerCase()) ||
      nc.email.toLowerCase().includes(membresiaSearchQuery.toLowerCase()) ||
      nc.telefone.includes(membresiaSearchQuery)
    ).slice(0, 5);
  }, [membresiaSearchQuery, mockNovosConvertidosParaMembresia]);

  // Selecionar novo convertido e preencher formulário
  const handleSelectNovoConvertido = (novoConvertido) => {
    setSelectedNovoConvertido(novoConvertido);
    setMembresiaFormData({
      nomeCompleto: novoConvertido.nomeCompleto,
      email: novoConvertido.email,
      telefone: novoConvertido.telefone,
      dataNascimento: novoConvertido.dataNascimento,
      endereco: novoConvertido.endereco,
      cidade: novoConvertido.cidade,
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
      endereco: '',
      cidade: '',
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

    try {
      // Simulação de criação - TODO: Substituir por chamada real à API
      setTimeout(() => {
        const novoAluno = {
          id: alunosMembresia.length + 1,
          nomeCompleto: membresiaFormData.nomeCompleto,
          email: membresiaFormData.email,
          telefone: membresiaFormData.telefone,
          dataNascimento: membresiaFormData.dataNascimento,
          endereco: membresiaFormData.endereco,
          cidade: membresiaFormData.cidade,
          dataMatricula: membresiaFormData.dataMatricula,
          aulas: [
            { numero: 1, concluida: false, dataConclusao: null },
            { numero: 2, concluida: false, dataConclusao: null },
            { numero: 3, concluida: false, dataConclusao: null },
            { numero: 4, concluida: false, dataConclusao: null },
            { numero: 5, concluida: false, dataConclusao: null }
          ]
        };
        setAlunosMembresia(prev => [...prev, novoAluno]);
        setMessageMembresia({ type: 'success', text: 'Matrícula realizada com sucesso!' });
        handleClearMembresiaSelection();
        setLoadingMembresia(false);
      }, 1000);
    } catch (error) {
      setMessageMembresia({ type: 'error', text: 'Erro ao realizar matrícula. Tente novamente.' });
      setLoadingMembresia(false);
    }
  };

  // Marcar/desmarcar aula
  const handleToggleAula = (alunoId, aulaNumero) => {
    setAlunosMembresia(prev => prev.map(aluno => {
      if (aluno.id === alunoId) {
        const updatedAulas = aluno.aulas.map(a => {
          if (a.numero === aulaNumero) {
            const novaConcluida = !a.concluida;
            return {
              ...a,
              concluida: novaConcluida,
              dataConclusao: novaConcluida ? new Date().toISOString().split('T')[0] : null
            };
          }
          return a;
        });
        return { ...aluno, aulas: updatedAulas };
      }
      return aluno;
    }));
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
                <span>Listar Membros</span>
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
                              {selectedVisitante.nome} {selectedVisitante.sobrenome}
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
                          required
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
                          required
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
                          placeholder="00000-000"
                          className="form-input"
                        />
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
                        <p className="field-hint">Estágio atual: {selectedVisitante.estagio}</p>
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
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-nomeCompleto">Nome completo</Label>
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

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-dataNascimento">Data de nascimento</Label>
                      <Input
                        type="date"
                        id="novo-convertido-dataNascimento"
                        name="dataNascimento"
                        value={novoConvertidoFormData.dataNascimento}
                        onChange={handleNovoConvertidoChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-whatsapp">WhatsApp</Label>
                      <Input
                        type="tel"
                        id="novo-convertido-whatsapp"
                        name="whatsapp"
                        value={novoConvertidoFormData.whatsapp}
                        onChange={handleNovoConvertidoChange}
                        placeholder="(00) 00000-0000"
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="novo-convertido-email">Email</Label>
                      <Input
                        type="email"
                        id="novo-convertido-email"
                        name="email"
                        value={novoConvertidoFormData.email}
                        onChange={handleNovoConvertidoChange}
                        placeholder="email@exemplo.com"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="novo-convertido-bairro">Bairro</Label>
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
                        required
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
                        {filteredNovosConvertidos.map(nc => (
                          <div
                            key={nc.id}
                            className="search-result-item"
                            onClick={() => handleSelectNovoConvertido(nc)}
                          >
                            <div>
                              <strong>{nc.nomeCompleto}</strong>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {nc.email} • {nc.telefone}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Exibir selecionado */}
                {selectedNovoConvertido && (
                  <div className="selected-person-card" style={{ marginBottom: '24px' }}>
                    <div>
                      <strong>Novo Convertido Selecionado:</strong> {selectedNovoConvertido.nomeCompleto}
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

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="membresia-endereco">Endereço</Label>
                        <Input
                          type="text"
                          id="membresia-endereco"
                          name="endereco"
                          value={membresiaFormData.endereco}
                          onChange={handleMembresiaFormChange}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <Label htmlFor="membresia-cidade">Cidade</Label>
                        <Input
                          type="text"
                          id="membresia-cidade"
                          name="cidade"
                          value={membresiaFormData.cidade}
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
                                  <strong>{aluno.nomeCompleto}</strong>
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Matrícula: {new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}
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
                <h2>Listar Membros</h2>
                <ListarMembros alunosMembresia={alunosMembresia} />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="integracao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Análises e Estatísticas</h2>
                <Analytics 
                  alunosMembresia={alunosMembresia}
                  mockNovosConvertidosParaMembresia={mockNovosConvertidosParaMembresia}
                />
              </div>
            </TabsContent>

            <TabsContent value="relatorios" className="integracao-tabs-content">
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

// Componente de Tabela de Novos Convertidos
const NovosConvertidosTable = () => {
  const [filters, setFilters] = useState({
    search: '',
    dataVisita: getCurrentDate(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dados mockados
  const mockNovosConvertidos = useMemo(() => {
    const novosConvertidos = [];
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
      
      novosConvertidos.push({
        id: i,
        recepcionadoPor: recepcionistas[Math.floor(Math.random() * recepcionistas.length)],
        diaVisita: `${dataVisita.getFullYear()}-${String(dataVisita.getMonth() + 1).padStart(2, '0')}-${String(dataVisita.getDate()).padStart(2, '0')}T${hora}:${minuto}`,
        nomeCompleto: nomes[Math.floor(Math.random() * nomes.length)],
        dataNascimento: `${1980 + Math.floor(Math.random() * 40)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        whatsapp: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `novoconvertido${i}@exemplo.com`,
        bairro: bairros[Math.floor(Math.random() * bairros.length)],
        cidade: cidades[Math.floor(Math.random() * cidades.length)],
        comoConheceu: comoConheceu[Math.floor(Math.random() * comoConheceu.length)],
        pedidoOracao: i % 3 === 0 ? 'Pedido de oração para saúde da família' : i % 3 === 1 ? 'Oração pela paz mundial' : 'Agradecimento pelas bênçãos recebidas',
        estagio: 'Novo Convertido'
      });
    }
    return novosConvertidos;
  }, []);

  // Filtrar dados
  const filteredData = useMemo(() => {
    return mockNovosConvertidos.filter(novoConvertido => {
      const matchSearch = !filters.search || 
        novoConvertido.nomeCompleto.toLowerCase().includes(filters.search.toLowerCase()) ||
        novoConvertido.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        novoConvertido.whatsapp.includes(filters.search);
      
      const novoConvertidoDate = novoConvertido.diaVisita.split('T')[0];
      const matchDate = !filters.dataVisita || novoConvertidoDate === filters.dataVisita;
      
      return matchSearch && matchDate;
    });
  }, [mockNovosConvertidos, filters]);

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
              <TableHead>Pedido de oração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Nenhum novo convertido encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((novoConvertido) => (
                <TableRow key={novoConvertido.id}>
                  <TableCell>{novoConvertido.recepcionadoPor}</TableCell>
                  <TableCell>{formatDate(novoConvertido.diaVisita)}</TableCell>
                  <TableCell>{novoConvertido.nomeCompleto}</TableCell>
                  <TableCell>{formatDate(novoConvertido.dataNascimento)}</TableCell>
                  <TableCell>{novoConvertido.whatsapp}</TableCell>
                  <TableCell>{novoConvertido.email}</TableCell>
                  <TableCell>{novoConvertido.bairro}</TableCell>
                  <TableCell>{novoConvertido.cidade}</TableCell>
                  <TableCell>{novoConvertido.comoConheceu}</TableCell>
                  <TableCell className="max-w-xs truncate" title={novoConvertido.pedidoOracao}>
                    {novoConvertido.pedidoOracao || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {filteredData.length > pageSize && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} novos convertidos
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
  const [filters, setFilters] = useState({
    search: '',
    dataMatricula: '',
    aulasConcluidas: '',
    aulasNaoFeitas: '',
    cidade: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtrar dados
  const filteredData = useMemo(() => {
    return alunosMembresia.filter(aluno => {
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
      
      // Filtro por cidade
      const matchCidade = !filters.cidade || 
        aluno.cidade.toLowerCase().includes(filters.cidade.toLowerCase());
      
      return matchSearch && matchData && matchAulasConcluidas && matchAulasNaoFeitas && matchCidade;
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
        <div className="filters-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px' }}>
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

          <div className="filter-group">
            <Label htmlFor="cidade-membros">Cidade</Label>
            <Input
              type="text"
              id="cidade-membros"
              placeholder="Digite a cidade..."
              value={filters.cidade}
              onChange={(e) => handleFilterChange('cidade', e.target.value)}
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
              <TableHead>Nome do Aluno</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Data Matrícula</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aulas Concluídas</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aulas Não Feitas</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Progresso</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 1</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 2</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 3</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 4</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Aula 5</TableHead>
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
                    <TableCell>{aluno.email}</TableCell>
                    <TableCell>{aluno.telefone}</TableCell>
                    <TableCell>{formatDate(aluno.dataMatricula)}</TableCell>
                    <TableCell>{aluno.cidade}</TableCell>
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
    </div>
  );
};

// Componente de Analytics
const Analytics = ({ alunosMembresia, mockNovosConvertidosParaMembresia }) => {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [periodoFiltro, setPeriodoFiltro] = useState({
    dataInicio: primeiroDiaMes.toISOString().split('T')[0],
    dataFim: ultimoDiaMes.toISOString().split('T')[0]
  });

  // Calcular estatísticas baseadas no período
  const estatisticas = useMemo(() => {
    // Filtrar novos convertidos por período (simulado - usando data de criação)
    const novosConvertidosNoPeriodo = mockNovosConvertidosParaMembresia.filter(nc => {
      // Simulação: considerar todos como no período atual
      return true;
    });

    // Filtrar alunos de membresia por período
    const alunosNoPeriodo = alunosMembresia.filter(aluno => {
      const dataMatricula = new Date(aluno.dataMatricula);
      const inicio = new Date(periodoFiltro.dataInicio);
      const fim = new Date(periodoFiltro.dataFim);
      return dataMatricula >= inicio && dataMatricula <= fim;
    });

    // Estatísticas de novos convertidos
    const totalNovosConvertidos = novosConvertidosNoPeriodo.length;

    // Estatísticas de alunos de membresia
    const totalAlunosMembresia = alunosNoPeriodo.length;
    const alunosComTodasAulas = alunosNoPeriodo.filter(aluno => 
      aluno.aulas.every(a => a.concluida)
    ).length;
    const alunosComAlgumaAula = alunosNoPeriodo.filter(aluno => 
      aluno.aulas.some(a => a.concluida)
    ).length;
    const alunosSemAulas = alunosNoPeriodo.filter(aluno => 
      aluno.aulas.every(a => !a.concluida)
    ).length;

    // Calcular total de aulas concluídas
    const totalAulasConcluidas = alunosNoPeriodo.reduce((total, aluno) => {
      return total + aluno.aulas.filter(a => a.concluida).length;
    }, 0);

    // Calcular total de aulas não concluídas
    const totalAulasNaoConcluidas = alunosNoPeriodo.reduce((total, aluno) => {
      return total + aluno.aulas.filter(a => !a.concluida).length;
    }, 0);

    // Taxa de conclusão
    const taxaConclusao = totalAlunosMembresia > 0 
      ? ((totalAulasConcluidas / (totalAlunosMembresia * 5)) * 100).toFixed(1)
      : 0;

    // Estatísticas por cidade
    const porCidade = {};
    alunosNoPeriodo.forEach(aluno => {
      if (!porCidade[aluno.cidade]) {
        porCidade[aluno.cidade] = 0;
      }
      porCidade[aluno.cidade]++;
    });
    const topCidades = Object.entries(porCidade)
      .map(([cidade, quantidade]) => ({ cidade, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // Estatísticas de progresso
    const alunosPorProgresso = {
      completo: alunosComTodasAulas,
      parcial: alunosComAlgumaAula - alunosComTodasAulas,
      nenhum: alunosSemAulas
    };

    // Estatísticas por mês (últimos 6 meses)
    const porMes = Array.from({ length: 6 }, (_, i) => {
      const data = new Date();
      data.setMonth(data.getMonth() - (5 - i));
      const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
      const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
      
      const alunosMes = alunosMembresia.filter(aluno => {
        const dataMatricula = new Date(aluno.dataMatricula);
        return dataMatricula >= inicioMes && dataMatricula <= fimMes;
      }).length;

      return { mes, quantidade: alunosMes };
    });

    return {
      totalNovosConvertidos,
      totalAlunosMembresia,
      alunosComTodasAulas,
      alunosComAlgumaAula,
      alunosSemAulas,
      totalAulasConcluidas,
      totalAulasNaoConcluidas,
      taxaConclusao,
      topCidades,
      alunosPorProgresso,
      porMes
    };
  }, [alunosMembresia, mockNovosConvertidosParaMembresia, periodoFiltro]);

  const handlePeriodoChange = (name, value) => {
    setPeriodoFiltro(prev => ({ ...prev, [name]: value }));
  };

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
    nomeMinisterio: 'Ministério Integração',
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
          nomeMinisterio: 'Ministério Integração',
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
        nomeMinisterio: 'Ministério Integração',
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

export default Integracao;
