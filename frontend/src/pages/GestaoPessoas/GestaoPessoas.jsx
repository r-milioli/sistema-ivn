import React, { useState, useMemo } from 'react';
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
import { Users, Edit, Search, List, Trash2, ChevronLeft, ChevronRight, UserCog, Plus, X } from 'lucide-react';
import './GestaoPessoas.css';

const GestaoPessoas = () => {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    sexo: '',
    estadoCivil: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para edição de pessoas
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nome: '',
    sobrenome: '',
    sexo: '',
    estadoCivil: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [messageEdit, setMessageEdit] = useState({ type: '', text: '' });

  // Estados para lista de pessoas
  const [activeTab, setActiveTab] = useState('gestao-pessoas');
  const [listFilters, setListFilters] = useState({
    search: '',
    cidade: '',
    estado: '',
    sexo: ''
  });
  const [currentPageList, setCurrentPageList] = useState(1);
  const [pageSizeList, setPageSizeList] = useState(10);

  // Lista mockada de pessoas - TODO: Substituir por chamada à API
  const [pessoas, setPessoas] = useState([
    {
      id: 1,
      nome: 'João',
      sobrenome: 'Silva',
      sexo: 'masculino',
      estadoCivil: 'casado',
      dataNascimento: '1985-05-15',
      telefone: '(11) 98765-4321',
      email: 'joao.silva@email.com',
      cep: '01310-100',
      rua: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Apto 101',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 2,
      nome: 'Maria',
      sobrenome: 'Santos',
      sexo: 'feminino',
      estadoCivil: 'solteiro',
      dataNascimento: '1990-08-20',
      telefone: '(11) 91234-5678',
      email: 'maria.santos@email.com',
      cep: '04547-130',
      rua: 'Rua das Flores',
      numero: '250',
      complemento: '',
      bairro: 'Vila Olímpia',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 3,
      nome: 'Pedro',
      sobrenome: 'Oliveira',
      sexo: 'masculino',
      estadoCivil: 'casado',
      dataNascimento: '1988-03-10',
      telefone: '(11) 99876-5432',
      email: 'pedro.oliveira@email.com',
      cep: '02013-000',
      rua: 'Rua Augusta',
      numero: '500',
      complemento: 'Sala 302',
      bairro: 'Consolação',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 4,
      nome: 'Ana',
      sobrenome: 'Costa',
      sexo: 'feminino',
      estadoCivil: 'divorciado',
      dataNascimento: '1992-11-25',
      telefone: '(11) 97654-3210',
      email: 'ana.costa@email.com',
      cep: '04038-001',
      rua: 'Avenida Ibirapuera',
      numero: '1500',
      complemento: '',
      bairro: 'Moema',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 5,
      nome: 'Carlos',
      sobrenome: 'Souza',
      sexo: 'masculino',
      estadoCivil: 'solteiro',
      dataNascimento: '1995-07-05',
      telefone: '(11) 92345-6789',
      email: 'carlos.souza@email.com',
      cep: '05433-070',
      rua: 'Rua dos Pinheiros',
      numero: '800',
      complemento: 'Apto 45',
      bairro: 'Pinheiros',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 6,
      nome: 'Juliana',
      sobrenome: 'Lima',
      sexo: 'feminino',
      estadoCivil: 'casado',
      dataNascimento: '1987-09-12',
      telefone: '(11) 94567-8901',
      email: 'juliana.lima@email.com',
      cep: '01234-567',
      rua: 'Rua dos Três Irmãos',
      numero: '300',
      complemento: '',
      bairro: 'Vila Madalena',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 7,
      nome: 'Roberto',
      sobrenome: 'Alves',
      sexo: 'masculino',
      estadoCivil: 'solteiro',
      dataNascimento: '1993-02-18',
      telefone: '(11) 93456-7890',
      email: 'roberto.alves@email.com',
      cep: '01310-200',
      rua: 'Avenida Brigadeiro',
      numero: '2000',
      complemento: 'Apto 501',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 8,
      nome: 'Fernanda',
      sobrenome: 'Rocha',
      sexo: 'feminino',
      estadoCivil: 'uniao-estavel',
      dataNascimento: '1991-06-30',
      telefone: '(11) 95678-9012',
      email: 'fernanda.rocha@email.com',
      cep: '04021-001',
      rua: 'Rua dos Pinheiros',
      numero: '1200',
      complemento: '',
      bairro: 'Pinheiros',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 9,
      nome: 'Lucas',
      sobrenome: 'Pereira',
      sexo: 'masculino',
      estadoCivil: 'casado',
      dataNascimento: '1986-12-05',
      telefone: '(11) 96789-0123',
      email: 'lucas.pereira@email.com',
      cep: '05015-000',
      rua: 'Rua Harmonia',
      numero: '400',
      complemento: 'Casa',
      bairro: 'Vila Madalena',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 10,
      nome: 'Beatriz',
      sobrenome: 'Ferreira',
      sexo: 'feminino',
      estadoCivil: 'solteiro',
      dataNascimento: '1994-04-22',
      telefone: '(11) 97890-1234',
      email: 'beatriz.ferreira@email.com',
      cep: '04530-000',
      rua: 'Avenida Faria Lima',
      numero: '1500',
      complemento: 'Sala 1001',
      bairro: 'Itaim Bibi',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 11,
      nome: 'Rafael',
      sobrenome: 'Martins',
      sexo: 'masculino',
      estadoCivil: 'divorciado',
      dataNascimento: '1989-10-15',
      telefone: '(11) 98901-2345',
      email: 'rafael.martins@email.com',
      cep: '01452-000',
      rua: 'Rua Bela Cintra',
      numero: '800',
      complemento: 'Apto 302',
      bairro: 'Consolação',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      id: 12,
      nome: 'Camila',
      sobrenome: 'Rodrigues',
      sexo: 'feminino',
      estadoCivil: 'casado',
      dataNascimento: '1992-01-28',
      telefone: '(11) 99012-3456',
      email: 'camila.rodrigues@email.com',
      cep: '05433-070',
      rua: 'Rua dos Pinheiros',
      numero: '900',
      complemento: '',
      bairro: 'Pinheiros',
      cidade: 'São Paulo',
      estado: 'SP'
    }
  ]);

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
      // Simulação de sucesso
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Pessoa cadastrada com sucesso!' });
        setFormData({
          nome: '',
          sobrenome: '',
          sexo: '',
          estadoCivil: '',
          dataNascimento: '',
          telefone: '',
          email: '',
          cep: '',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao cadastrar pessoa. Tente novamente.' });
      setLoading(false);
    }
  };

  // Filtrar pessoas para pesquisa
  const filteredPessoas = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return pessoas.filter(pessoa => {
      const nomeCompleto = `${pessoa.nome} ${pessoa.sobrenome}`.toLowerCase();
      const email = pessoa.email?.toLowerCase() || '';
      const telefone = pessoa.telefone?.replace(/\D/g, '') || '';
      const searchQueryClean = query.replace(/\D/g, '');
      
      return nomeCompleto.includes(query) ||
             email.includes(query) ||
             telefone.includes(searchQueryClean);
    });
  }, [searchQuery, pessoas]);

  // Preencher formulário quando pessoa for selecionada
  const handleSelectPerson = (pessoa) => {
    setSelectedPerson(pessoa);
    setEditFormData({
      nome: pessoa.nome || '',
      sobrenome: pessoa.sobrenome || '',
      sexo: pessoa.sexo || '',
      estadoCivil: pessoa.estadoCivil || '',
      dataNascimento: pessoa.dataNascimento || '',
      telefone: pessoa.telefone || '',
      email: pessoa.email || '',
      cep: pessoa.cep || '',
      rua: pessoa.rua || '',
      numero: pessoa.numero || '',
      complemento: pessoa.complemento || '',
      bairro: pessoa.bairro || '',
      cidade: pessoa.cidade || '',
      estado: pessoa.estado || ''
    });
    setSearchQuery('');
    setMessageEdit({ type: '', text: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoadingEdit(true);
    setMessageEdit({ type: '', text: '' });

    if (!selectedPerson) {
      setMessageEdit({ type: 'error', text: 'Por favor, selecione uma pessoa para editar.' });
      setLoadingEdit(false);
      return;
    }

    try {
      // Simulação de sucesso
      setTimeout(() => {
        setMessageEdit({ type: 'success', text: 'Pessoa atualizada com sucesso!' });
        setLoadingEdit(false);
      }, 1000);
    } catch (error) {
      setMessageEdit({ type: 'error', text: 'Erro ao atualizar pessoa. Tente novamente.' });
      setLoadingEdit(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedPerson(null);
    setEditFormData({
      nome: '',
      sobrenome: '',
      sexo: '',
      estadoCivil: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    });
    setSearchQuery('');
    setMessageEdit({ type: '', text: '' });
  };

  // Filtrar pessoas para lista
  const filteredListPessoas = useMemo(() => {
    return pessoas.filter(pessoa => {
      // Filtro de busca (nome, email, telefone)
      if (listFilters.search) {
        const query = listFilters.search.toLowerCase();
        const nomeCompleto = `${pessoa.nome} ${pessoa.sobrenome}`.toLowerCase();
        const email = pessoa.email?.toLowerCase() || '';
        const telefone = pessoa.telefone?.replace(/\D/g, '') || '';
        const searchQueryClean = query.replace(/\D/g, '');
        
        if (!nomeCompleto.includes(query) && 
            !email.includes(query) && 
            !telefone.includes(searchQueryClean)) {
          return false;
        }
      }

      // Filtro por cidade
      if (listFilters.cidade) {
        if (pessoa.cidade?.toLowerCase() !== listFilters.cidade.toLowerCase()) {
          return false;
        }
      }

      // Filtro por estado
      if (listFilters.estado) {
        if (pessoa.estado !== listFilters.estado) {
          return false;
        }
      }

      // Filtro por sexo
      if (listFilters.sexo) {
        if (pessoa.sexo !== listFilters.sexo) {
          return false;
        }
      }

      return true;
    });
  }, [pessoas, listFilters]);

  // Paginação da lista
  const totalPagesList = useMemo(() => 
    Math.ceil(filteredListPessoas.length / pageSizeList), 
    [filteredListPessoas.length, pageSizeList]
  );
  const startIndexList = useMemo(() => 
    (currentPageList - 1) * pageSizeList, 
    [currentPageList, pageSizeList]
  );
  const endIndexList = useMemo(() => 
    startIndexList + pageSizeList, 
    [startIndexList, pageSizeList]
  );
  const paginatedListPessoas = useMemo(() => 
    filteredListPessoas.slice(startIndexList, endIndexList), 
    [filteredListPessoas, startIndexList, endIndexList]
  );

  // Páginas para exibição
  const pagesToShowList = useMemo(() => {
    const pages = [];
    if (totalPagesList <= 5) {
      for (let i = 1; i <= totalPagesList; i++) {
        pages.push(i);
      }
    } else if (currentPageList <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPageList >= totalPagesList - 2) {
      for (let i = totalPagesList - 4; i <= totalPagesList; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPageList - 2; i <= currentPageList + 2; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [totalPagesList, currentPageList]);

  const handleListFilterChange = (name, value) => {
    setListFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPageList(1); // Reset para primeira página ao filtrar
  };

  // Função para editar pessoa da lista
  const handleEditFromList = (pessoa) => {
    handleSelectPerson(pessoa);
    setActiveTab('editar-pessoas');
  };

  // Função para excluir pessoa
  const handleDeletePerson = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta pessoa?')) {
      setPessoas(prev => prev.filter(p => p.id !== id));
      // Se a pessoa excluída estava selecionada, limpar seleção
      if (selectedPerson?.id === id) {
        handleClearSelection();
      }
      // Ajustar página se necessário
      const newTotalPages = Math.ceil((filteredListPessoas.length - 1) / pageSizeList);
      if (currentPageList > newTotalPages && newTotalPages > 0) {
        setCurrentPageList(newTotalPages);
      }
    }
  };

  // Obter lista única de cidades para filtro
  const uniqueCidades = useMemo(() => {
    const cidades = [...new Set(pessoas.map(p => p.cidade).filter(Boolean))];
    return cidades.sort();
  }, [pessoas]);

  // Estados para atribuição
  const [atribuicaoSearchQuery, setAtribuicaoSearchQuery] = useState('');
  const [selectedPersonAtribuicao, setSelectedPersonAtribuicao] = useState(null);
  const [atribuicaoFormData, setAtribuicaoFormData] = useState({
    cargoEclesiastico: '',
    estagiosUsuario: [],
    ministeriosLider: [],
    ministeriosParticipante: [],
    tipoUsuario: ''
  });
  const [loadingAtribuicao, setLoadingAtribuicao] = useState(false);
  const [messageAtribuicao, setMessageAtribuicao] = useState({ type: '', text: '' });

  // Lista mockada de ministérios - TODO: Substituir por chamada à API
  const [ministerios] = useState([
    { id: 1, nome: 'Louvor' },
    { id: 2, nome: 'Jovens' },
    { id: 3, nome: 'Crianças' },
    { id: 4, nome: 'Intercessão' },
    { id: 5, nome: 'Recepção' },
    { id: 6, nome: 'Mídia' },
    { id: 7, nome: 'Limpeza' },
    { id: 8, nome: 'Segurança' },
    { id: 9, nome: 'Ensino' },
    { id: 10, nome: 'Missões' },
    { id: 11, nome: 'Ação Social' },
    { id: 12, nome: 'Visitação' }
  ]);

  // Filtrar pessoas para atribuição
  const filteredPessoasAtribuicao = useMemo(() => {
    if (!atribuicaoSearchQuery.trim()) return [];
    
    const query = atribuicaoSearchQuery.toLowerCase();
    return pessoas.filter(pessoa => {
      const nomeCompleto = `${pessoa.nome} ${pessoa.sobrenome}`.toLowerCase();
      const email = pessoa.email?.toLowerCase() || '';
      const telefone = pessoa.telefone?.replace(/\D/g, '') || '';
      const searchQueryClean = query.replace(/\D/g, '');
      
      return nomeCompleto.includes(query) ||
             email.includes(query) ||
             telefone.includes(searchQueryClean);
    });
  }, [atribuicaoSearchQuery, pessoas]);

  // Preencher formulário quando pessoa for selecionada na atribuição
  const handleSelectPersonAtribuicao = (pessoa) => {
    setSelectedPersonAtribuicao(pessoa);
    setAtribuicaoSearchQuery('');
    setMessageAtribuicao({ type: '', text: '' });
  };

  const handleAtribuicaoChange = (e) => {
    const { name, value } = e.target;
    setAtribuicaoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Estados para seleção de estágios e ministérios
  const [estagioSelecionado, setEstagioSelecionado] = useState('');
  const [ministerioLiderSelecionado, setMinisterioLiderSelecionado] = useState('');
  const [ministerioParticipanteSelecionado, setMinisterioParticipanteSelecionado] = useState('');

  const handleAdicionarEstagio = () => {
    if (estagioSelecionado && !atribuicaoFormData.estagiosUsuario.includes(estagioSelecionado)) {
      setAtribuicaoFormData(prev => {
        const estagios = [...prev.estagiosUsuario, estagioSelecionado];
        return {
          ...prev,
          estagiosUsuario: estagios,
          // Limpar ministérios se não for mais líder ou participante
          ministeriosLider: estagios.includes('Líder') ? prev.ministeriosLider : [],
          ministeriosParticipante: estagios.includes('Participante de Ministério') ? prev.ministeriosParticipante : []
        };
      });
      setEstagioSelecionado('');
    }
  };

  const handleRemoverEstagio = (estagio) => {
    setAtribuicaoFormData(prev => {
      const estagios = prev.estagiosUsuario.filter(e => e !== estagio);
      return {
        ...prev,
        estagiosUsuario: estagios,
        // Limpar ministérios se não for mais líder ou participante
        ministeriosLider: estagios.includes('Líder') ? prev.ministeriosLider : [],
        ministeriosParticipante: estagios.includes('Participante de Ministério') ? prev.ministeriosParticipante : []
      };
    });
  };

  const handleAdicionarMinisterioLider = () => {
    if (ministerioLiderSelecionado && !atribuicaoFormData.ministeriosLider.includes(Number(ministerioLiderSelecionado))) {
      setAtribuicaoFormData(prev => ({
        ...prev,
        ministeriosLider: [...prev.ministeriosLider, Number(ministerioLiderSelecionado)]
      }));
      setMinisterioLiderSelecionado('');
    }
  };

  const handleRemoverMinisterioLider = (ministerioId) => {
    setAtribuicaoFormData(prev => ({
      ...prev,
      ministeriosLider: prev.ministeriosLider.filter(m => m !== ministerioId)
    }));
  };

  const handleAdicionarMinisterioParticipante = () => {
    if (ministerioParticipanteSelecionado && !atribuicaoFormData.ministeriosParticipante.includes(Number(ministerioParticipanteSelecionado))) {
      setAtribuicaoFormData(prev => ({
        ...prev,
        ministeriosParticipante: [...prev.ministeriosParticipante, Number(ministerioParticipanteSelecionado)]
      }));
      setMinisterioParticipanteSelecionado('');
    }
  };

  const handleRemoverMinisterioParticipante = (ministerioId) => {
    setAtribuicaoFormData(prev => ({
      ...prev,
      ministeriosParticipante: prev.ministeriosParticipante.filter(m => m !== ministerioId)
    }));
  };

  const handleAtribuicaoSubmit = async (e) => {
    e.preventDefault();
    setLoadingAtribuicao(true);
    setMessageAtribuicao({ type: '', text: '' });

    if (!selectedPersonAtribuicao) {
      setMessageAtribuicao({ type: 'error', text: 'Por favor, selecione uma pessoa para atribuir.' });
      setLoadingAtribuicao(false);
      return;
    }

    if (atribuicaoFormData.estagiosUsuario.length === 0) {
      setMessageAtribuicao({ type: 'error', text: 'Por favor, selecione pelo menos um estágio de usuário.' });
      setLoadingAtribuicao(false);
      return;
    }

    if (atribuicaoFormData.estagiosUsuario.includes('Líder') && atribuicaoFormData.ministeriosLider.length === 0) {
      setMessageAtribuicao({ type: 'error', text: 'Por favor, selecione pelo menos um ministério para líder.' });
      setLoadingAtribuicao(false);
      return;
    }

    if (atribuicaoFormData.estagiosUsuario.includes('Participante de Ministério') && atribuicaoFormData.ministeriosParticipante.length === 0) {
      setMessageAtribuicao({ type: 'error', text: 'Por favor, selecione pelo menos um ministério para participante.' });
      setLoadingAtribuicao(false);
      return;
    }

    try {
      // Simulação de sucesso
      setTimeout(() => {
        setMessageAtribuicao({ type: 'success', text: 'Atribuições salvas com sucesso!' });
        setLoadingAtribuicao(false);
      }, 1000);
    } catch (error) {
      setMessageAtribuicao({ type: 'error', text: 'Erro ao salvar atribuições. Tente novamente.' });
      setLoadingAtribuicao(false);
    }
  };

  const handleClearAtribuicaoSelection = () => {
    setSelectedPersonAtribuicao(null);
    setAtribuicaoFormData({
      cargoEclesiastico: '',
      estagiosUsuario: [],
      ministeriosLider: [],
      ministeriosParticipante: [],
      tipoUsuario: ''
    });
    setAtribuicaoSearchQuery('');
    setMessageAtribuicao({ type: '', text: '' });
    setEstagioSelecionado('');
    setMinisterioLiderSelecionado('');
    setMinisterioParticipanteSelecionado('');
  };

  // Componente do formulário (reutilizável)
  const PessoaForm = ({ formData, handleChange, loading, message, submitText, cancelButton, onCancel, onSubmit }) => (
    <form onSubmit={onSubmit} className="pessoa-form">
      {message.text && (
        <div className={`form-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor="edit-nome">Nome</Label>
          <Input
            type="text"
            id="edit-nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Digite o nome"
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="edit-sobrenome">Sobrenome completo</Label>
          <Input
            type="text"
            id="edit-sobrenome"
            name="sobrenome"
            value={formData.sobrenome}
            onChange={handleChange}
            placeholder="Digite o sobrenome completo"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor="edit-sexo">Sexo</Label>
          <select
            id="edit-sexo"
            name="sexo"
            value={formData.sexo}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Selecione o sexo</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
            <option value="nao-informar">Prefiro não informar</option>
          </select>
        </div>
        <div className="form-group">
          <Label htmlFor="edit-estadoCivil">Estado Civil</Label>
          <select
            id="edit-estadoCivil"
            name="estadoCivil"
            value={formData.estadoCivil}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Selecione o estado civil</option>
            <option value="solteiro">Solteiro(a)</option>
            <option value="casado">Casado(a)</option>
            <option value="divorciado">Divorciado(a)</option>
            <option value="viuvo">Viúvo(a)</option>
            <option value="uniao-estavel">União Estável</option>
          </select>
        </div>
      </div>

      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor="edit-dataNascimento">Data de Nascimento</Label>
          <Input
            type="date"
            id="edit-dataNascimento"
            name="dataNascimento"
            value={formData.dataNascimento}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="edit-telefone">Telefone</Label>
          <Input
            type="tel"
            id="edit-telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            type="email"
            id="edit-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@exemplo.com"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Label htmlFor="edit-cep">CEP</Label>
          <Input
            type="text"
            id="edit-cep"
            name="cep"
            value={formData.cep}
            onChange={handleChange}
            placeholder="00000-000"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row form-row-2">
        <div className="form-group" style={{ flex: 2 }}>
          <Label htmlFor="edit-rua">Rua</Label>
          <Input
            type="text"
            id="edit-rua"
            name="rua"
            value={formData.rua}
            onChange={handleChange}
            placeholder="Digite o nome da rua"
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="edit-numero">Número</Label>
          <Input
            type="text"
            id="edit-numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            placeholder="Nº"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Label htmlFor="edit-complemento">Complemento</Label>
          <Input
            type="text"
            id="edit-complemento"
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
          <Label htmlFor="edit-bairro">Bairro</Label>
          <Input
            type="text"
            id="edit-bairro"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            placeholder="Digite o bairro"
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="edit-cidade">Cidade</Label>
          <Input
            type="text"
            id="edit-cidade"
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
          <Label htmlFor="edit-estado">Estado</Label>
          <select
            id="edit-estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            required
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

      <div className="form-actions">
        {cancelButton && onCancel && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            className="cancel-button"
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Salvando...' : submitText}
        </Button>
      </div>
    </form>
  );

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Gestão de Pessoas</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gestao-pessoas-tabs">
            <TabsList className="gestao-pessoas-tabs-list">
              <TabsTrigger value="gestao-pessoas" className="gestao-pessoas-tabs-trigger">
                <Users className="tab-icon" />
                <span>Adicionar Pessoas</span>
              </TabsTrigger>
              <TabsTrigger value="editar-pessoas" className="gestao-pessoas-tabs-trigger">
                <Edit className="tab-icon" />
                <span>Editar Pessoas</span>
              </TabsTrigger>
              <TabsTrigger value="lista-pessoas" className="gestao-pessoas-tabs-trigger">
                <List className="tab-icon" />
                <span>Lista de Pessoas</span>
              </TabsTrigger>
              <TabsTrigger value="atribuicao" className="gestao-pessoas-tabs-trigger">
                <UserCog className="tab-icon" />
                <span>Atribuição</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="gestao-pessoas" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Cadastrar Pessoa</h2>
                
                <form onSubmit={handleSubmit} className="pessoa-form">
                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

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
                        placeholder="Digite o sobrenome completo"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="sexo">Sexo</Label>
                      <select
                        id="sexo"
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o sexo</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                        <option value="nao-informar">Prefiro não informar</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <select
                        id="estadoCivil"
                        name="estadoCivil"
                        value={formData.estadoCivil}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o estado civil</option>
                        <option value="solteiro">Solteiro(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viuvo">Viúvo(a)</option>
                        <option value="uniao-estavel">União Estável</option>
                      </select>
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
                        required
                        className="form-input"
                      />
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
                        required
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
                        required
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
                        required
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
                      <Label htmlFor="estado">Estado</Label>
                      <select
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        required
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

                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      className="submit-button"
                      disabled={loading}
                    >
                      {loading ? 'Cadastrando...' : 'Cadastrar Pessoa'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="editar-pessoas" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Editar Pessoa</h2>
                
                {/* Campo de Pesquisa */}
                <div className="search-section">
                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="search-person">Buscar Pessoa</Label>
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <Input
                          type="text"
                          id="search-person"
                          placeholder="Digite o nome, email ou telefone..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="form-input search-input"
                          disabled={!!selectedPerson}
                        />
                      </div>
                      
                      {/* Lista de resultados da pesquisa */}
                      {searchQuery && !selectedPerson && filteredPessoas.length > 0 && (
                        <div className="search-results">
                          {filteredPessoas.map(pessoa => (
                            <div
                              key={pessoa.id}
                              className="search-result-item"
                              onClick={() => handleSelectPerson(pessoa)}
                            >
                              <div className="result-item-info">
                                <div className="result-item-name">
                                  {pessoa.nome} {pessoa.sobrenome}
                                </div>
                                <div className="result-item-details">
                                  {pessoa.email && <span>{pessoa.email}</span>}
                                  {pessoa.telefone && <span>{pessoa.telefone}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchQuery && !selectedPerson && filteredPessoas.length === 0 && (
                        <div className="search-no-results">
                          Nenhuma pessoa encontrada
                        </div>
                      )}

                      {/* Pessoa selecionada */}
                      {selectedPerson && (
                        <div className="selected-person">
                          <div className="selected-person-info">
                            <div className="selected-person-name">
                              {selectedPerson.nome} {selectedPerson.sobrenome}
                            </div>
                            <div className="selected-person-details">
                              {selectedPerson.email && <span>{selectedPerson.email}</span>}
                              {selectedPerson.telefone && <span>{selectedPerson.telefone}</span>}
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

                {/* Formulário de Edição */}
                {selectedPerson && (
                  <div className="edit-form-section">
                    <PessoaForm
                      formData={editFormData}
                      handleChange={handleEditChange}
                      loading={loadingEdit}
                      message={messageEdit}
                      submitText="Atualizar Pessoa"
                      cancelButton={true}
                      onCancel={handleClearSelection}
                      onSubmit={handleEditSubmit}
                    />
                  </div>
                )}

                {!selectedPerson && (
                  <div className="no-selection-message">
                    <p>Digite no campo de busca acima para localizar uma pessoa e preencher o formulário automaticamente.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lista-pessoas" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Lista de Pessoas</h2>
                
                {/* Área de Filtros */}
                <div className="filters-section">
                  <div className="filters-row">
                    <div className="filter-group">
                      <Label htmlFor="search-list">Buscar</Label>
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <Input
                          type="text"
                          id="search-list"
                          placeholder="Nome, email ou telefone..."
                          value={listFilters.search}
                          onChange={(e) => handleListFilterChange('search', e.target.value)}
                          className="form-input search-input"
                        />
                      </div>
                    </div>

                    <div className="filter-group">
                      <Label htmlFor="filter-cidade">Cidade</Label>
                      <select
                        id="filter-cidade"
                        value={listFilters.cidade}
                        onChange={(e) => handleListFilterChange('cidade', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Todas as cidades</option>
                        {uniqueCidades.map(cidade => (
                          <option key={cidade} value={cidade}>
                            {cidade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <Label htmlFor="filter-estado">Estado</Label>
                      <select
                        id="filter-estado"
                        value={listFilters.estado}
                        onChange={(e) => handleListFilterChange('estado', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Todos os estados</option>
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

                    <div className="filter-group">
                      <Label htmlFor="filter-sexo">Sexo</Label>
                      <select
                        id="filter-sexo"
                        value={listFilters.sexo}
                        onChange={(e) => handleListFilterChange('sexo', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Todos</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                        <option value="nao-informar">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tabela */}
                <div className="pessoas-table-container">
                  <div className="table-wrapper">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Sexo</TableHead>
                          <TableHead>Estado Civil</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedListPessoas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center">
                              Nenhuma pessoa encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedListPessoas.map((pessoa) => (
                            <TableRow key={pessoa.id}>
                              <TableCell>
                                <div className="pessoa-name-cell">
                                  {pessoa.nome} {pessoa.sobrenome}
                                </div>
                              </TableCell>
                              <TableCell>{pessoa.email || '-'}</TableCell>
                              <TableCell>{pessoa.telefone || '-'}</TableCell>
                              <TableCell>{pessoa.cidade || '-'}</TableCell>
                              <TableCell>{pessoa.estado || '-'}</TableCell>
                              <TableCell>
                                {pessoa.sexo === 'masculino' ? 'Masculino' :
                                 pessoa.sexo === 'feminino' ? 'Feminino' :
                                 pessoa.sexo === 'outro' ? 'Outro' :
                                 pessoa.sexo === 'nao-informar' ? 'Não informar' : '-'}
                              </TableCell>
                              <TableCell>
                                {pessoa.estadoCivil === 'solteiro' ? 'Solteiro(a)' :
                                 pessoa.estadoCivil === 'casado' ? 'Casado(a)' :
                                 pessoa.estadoCivil === 'divorciado' ? 'Divorciado(a)' :
                                 pessoa.estadoCivil === 'viuvo' ? 'Viúvo(a)' :
                                 pessoa.estadoCivil === 'uniao-estavel' ? 'União Estável' : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="table-actions">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditFromList(pessoa)}
                                    className="action-button edit-button"
                                  >
                                    <Edit className="action-icon" />
                                    Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePerson(pessoa.id)}
                                    className="action-button delete-button"
                                  >
                                    <Trash2 className="action-icon" />
                                    Excluir
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
                  {filteredListPessoas.length > pageSizeList && (
                    <div className="pagination-section">
                      <div className="pagination-info">
                        <span>
                          Mostrando {startIndexList + 1} a {Math.min(endIndexList, filteredListPessoas.length)} de {filteredListPessoas.length} pessoas
                        </span>
                        <div className="page-size-selector">
                          <Label htmlFor="pageSizeList">Linhas por página:</Label>
                          <select
                            id="pageSizeList"
                            value={pageSizeList}
                            onChange={(e) => {
                              setPageSizeList(Number(e.target.value));
                              setCurrentPageList(1);
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
                          onClick={() => setCurrentPageList(prev => Math.max(1, prev - 1))}
                          disabled={currentPageList === 1}
                          className="pagination-button"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        
                        <div className="page-numbers">
                          {pagesToShowList.map(pageNum => (
                            <Button
                              key={pageNum}
                              variant={currentPageList === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPageList(pageNum)}
                              className="pagination-button page-number"
                            >
                              {pageNum}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageList(prev => Math.min(totalPagesList, prev + 1))}
                          disabled={currentPageList >= totalPagesList}
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

            <TabsContent value="atribuicao" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Atribuição</h2>
                
                {/* Campo de Pesquisa */}
                <div className="search-section">
                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="search-person-atribuicao">Buscar Pessoa</Label>
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <Input
                          type="text"
                          id="search-person-atribuicao"
                          placeholder="Digite o nome, email ou telefone..."
                          value={atribuicaoSearchQuery}
                          onChange={(e) => setAtribuicaoSearchQuery(e.target.value)}
                          className="form-input search-input"
                          disabled={!!selectedPersonAtribuicao}
                        />
                      </div>
                      
                      {/* Lista de resultados da pesquisa */}
                      {atribuicaoSearchQuery && !selectedPersonAtribuicao && filteredPessoasAtribuicao.length > 0 && (
                        <div className="search-results">
                          {filteredPessoasAtribuicao.map(pessoa => (
                            <div
                              key={pessoa.id}
                              className="search-result-item"
                              onClick={() => handleSelectPersonAtribuicao(pessoa)}
                            >
                              <div className="result-item-info">
                                <div className="result-item-name">
                                  {pessoa.nome} {pessoa.sobrenome}
                                </div>
                                <div className="result-item-details">
                                  {pessoa.email && <span>{pessoa.email}</span>}
                                  {pessoa.telefone && <span>{pessoa.telefone}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {atribuicaoSearchQuery && !selectedPersonAtribuicao && filteredPessoasAtribuicao.length === 0 && (
                        <div className="search-no-results">
                          Nenhuma pessoa encontrada
                        </div>
                      )}

                      {/* Pessoa selecionada */}
                      {selectedPersonAtribuicao && (
                        <div className="selected-person">
                          <div className="selected-person-info">
                            <div className="selected-person-name">
                              {selectedPersonAtribuicao.nome} {selectedPersonAtribuicao.sobrenome}
                            </div>
                            <div className="selected-person-details">
                              {selectedPersonAtribuicao.email && <span>{selectedPersonAtribuicao.email}</span>}
                              {selectedPersonAtribuicao.telefone && <span>{selectedPersonAtribuicao.telefone}</span>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearAtribuicaoSelection}
                            className="clear-selection-button"
                          >
                            Limpar Seleção
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formulário de Atribuição */}
                {selectedPersonAtribuicao && (
                  <form onSubmit={handleAtribuicaoSubmit} className="pessoa-form">
                    {messageAtribuicao.text && (
                      <div className={`form-message ${messageAtribuicao.type}`}>
                        {messageAtribuicao.text}
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="cargoEclesiastico">Cargo Eclesiástico</Label>
                        <select
                          id="cargoEclesiastico"
                          name="cargoEclesiastico"
                          value={atribuicaoFormData.cargoEclesiastico}
                          onChange={handleAtribuicaoChange}
                          className="form-select"
                        >
                          <option value="">Selecione um cargo (opcional)</option>
                          <option value="Pastor">Pastor</option>
                          <option value="Evangelista">Evangelista</option>
                          <option value="Presbítero">Presbítero</option>
                          <option value="Diácono">Diácono</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="estagioSelecionado">Estágios de Usuário</Label>
                        <div className="autores-wrapper">
                          <div className="autores-select-wrapper">
                            <select
                              id="estagioSelecionado"
                              value={estagioSelecionado}
                              onChange={(e) => setEstagioSelecionado(e.target.value)}
                              className="form-select"
                            >
                              <option value="">Selecione um estágio</option>
                              {['Visitante', 'Novo Convertido', 'Membro', 'Participante de Ministério', 'Líder']
                                .filter(estagio => !atribuicaoFormData.estagiosUsuario.includes(estagio))
                                .map(estagio => (
                                  <option key={estagio} value={estagio}>
                                    {estagio}
                                  </option>
                                ))}
                            </select>
                            <Button
                              type="button"
                              onClick={handleAdicionarEstagio}
                              className="add-autor-button"
                              disabled={!estagioSelecionado}
                            >
                              <Plus className="add-icon" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {atribuicaoFormData.estagiosUsuario.length > 0 && (
                            <div className="autores-list">
                              <Label>Estágios adicionados:</Label>
                              <div className="autores-tags">
                                {atribuicaoFormData.estagiosUsuario.map(estagio => (
                                  <div key={estagio} className="autor-tag">
                                    <span>{estagio}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoverEstagio(estagio)}
                                      className="remove-autor-button"
                                    >
                                      <X className="remove-icon" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {atribuicaoFormData.estagiosUsuario.includes('Líder') && (
                      <div className="form-row">
                        <div className="form-group">
                          <Label htmlFor="ministerioLiderSelecionado">Ministérios como Líder</Label>
                          <div className="autores-wrapper">
                            <div className="autores-select-wrapper">
                              <select
                                id="ministerioLiderSelecionado"
                                value={ministerioLiderSelecionado}
                                onChange={(e) => setMinisterioLiderSelecionado(e.target.value)}
                                className="form-select"
                              >
                                <option value="">Selecione um ministério</option>
                                {ministerios
                                  .filter(m => !atribuicaoFormData.ministeriosLider.includes(m.id))
                                  .map(ministerio => (
                                    <option key={ministerio.id} value={ministerio.id}>
                                      {ministerio.nome}
                                    </option>
                                  ))}
                              </select>
                              <Button
                                type="button"
                                onClick={handleAdicionarMinisterioLider}
                                className="add-autor-button"
                                disabled={!ministerioLiderSelecionado}
                              >
                                <Plus className="add-icon" />
                                Adicionar
                              </Button>
                            </div>
                            
                            {atribuicaoFormData.ministeriosLider.length > 0 && (
                              <div className="autores-list">
                                <Label>Ministérios como líder adicionados:</Label>
                                <div className="autores-tags">
                                  {atribuicaoFormData.ministeriosLider.map(ministerioId => {
                                    const ministerio = ministerios.find(m => m.id === ministerioId);
                                    return (
                                      <div key={ministerioId} className="autor-tag">
                                        <span>{ministerio?.nome || `ID: ${ministerioId}`}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoverMinisterioLider(ministerioId)}
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
                    )}

                    {atribuicaoFormData.estagiosUsuario.includes('Participante de Ministério') && (
                      <div className="form-row">
                        <div className="form-group">
                          <Label htmlFor="ministerioParticipanteSelecionado">Ministérios como Participante</Label>
                          <div className="autores-wrapper">
                            <div className="autores-select-wrapper">
                              <select
                                id="ministerioParticipanteSelecionado"
                                value={ministerioParticipanteSelecionado}
                                onChange={(e) => setMinisterioParticipanteSelecionado(e.target.value)}
                                className="form-select"
                              >
                                <option value="">Selecione um ministério</option>
                                {ministerios
                                  .filter(m => !atribuicaoFormData.ministeriosParticipante.includes(m.id))
                                  .map(ministerio => (
                                    <option key={ministerio.id} value={ministerio.id}>
                                      {ministerio.nome}
                                    </option>
                                  ))}
                              </select>
                              <Button
                                type="button"
                                onClick={handleAdicionarMinisterioParticipante}
                                className="add-autor-button"
                                disabled={!ministerioParticipanteSelecionado}
                              >
                                <Plus className="add-icon" />
                                Adicionar
                              </Button>
                            </div>
                            
                            {atribuicaoFormData.ministeriosParticipante.length > 0 && (
                              <div className="autores-list">
                                <Label>Ministérios como participante adicionados:</Label>
                                <div className="autores-tags">
                                  {atribuicaoFormData.ministeriosParticipante.map(ministerioId => {
                                    const ministerio = ministerios.find(m => m.id === ministerioId);
                                    return (
                                      <div key={ministerioId} className="autor-tag">
                                        <span>{ministerio?.nome || `ID: ${ministerioId}`}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoverMinisterioParticipante(ministerioId)}
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
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="tipoUsuario">Tipo de Usuário</Label>
                        <select
                          id="tipoUsuario"
                          name="tipoUsuario"
                          value={atribuicaoFormData.tipoUsuario}
                          onChange={handleAtribuicaoChange}
                          required
                          className="form-select"
                        >
                          <option value="">Selecione o tipo de usuário</option>
                          <option value="Usuario">Usuário</option>
                          <option value="Admin">Admin</option>
                          <option value="SuperAdmin">SuperAdmin</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-actions">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleClearAtribuicaoSelection}
                        className="cancel-button"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="submit-button"
                        disabled={loadingAtribuicao}
                      >
                        {loadingAtribuicao ? 'Salvando...' : 'Salvar Atribuições'}
                      </Button>
                    </div>
                  </form>
                )}

                {!selectedPersonAtribuicao && (
                  <div className="no-selection-message">
                    <p>Digite no campo de busca acima para localizar uma pessoa e atribuir cargos, estágios e ministérios.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default GestaoPessoas;
