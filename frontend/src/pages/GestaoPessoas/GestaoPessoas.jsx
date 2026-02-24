import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import BackToDashboard from '../../components/BackToDashboard/BackToDashboard';
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
import { Users, Edit, Search, List, Trash2, ChevronLeft, ChevronRight, UserCog, Plus, X, ClipboardList, FileText, Archive } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import './GestaoPessoas.css';

// Formulário de pessoa (fora do componente para evitar re-render a cada digitação)
const PREFIX_ADD = '';
const PREFIX_EDIT = 'edit-';

const VIA_CEP_URL = 'https://viacep.com.br/ws';

function PessoaForm({ formData, handleChange, loading, submitText, cancelButton, onCancel, onSubmit, idPrefix = PREFIX_ADD, onCepBlur }) {
  const id = (name) => (idPrefix ? `${idPrefix}${name}` : name);

  const handleCepBlur = (e) => {
    const cep = (e.target.value || '').replace(/\D/g, '');
    if (onCepBlur && cep.length === 8) {
      onCepBlur(cep);
    }
  };

  return (
    <form onSubmit={onSubmit} className="pessoa-form">
      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor={id('nome')}>Nome *</Label>
          <Input type="text" id={id('nome')} name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite o nome" required className="form-input" />
        </div>
        <div className="form-group">
          <Label htmlFor={id('sobrenome')}>Sobrenome</Label>
          <Input type="text" id={id('sobrenome')} name="sobrenome" value={formData.sobrenome} onChange={handleChange} placeholder="Digite o sobrenome" className="form-input" />
        </div>
      </div>
      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor={id('sexo')}>Sexo</Label>
          <select id={id('sexo')} name="sexo" value={formData.sexo} onChange={handleChange} className="form-select">
            <option value="">Selecione o sexo</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
            <option value="nao-informar">Prefiro não informar</option>
          </select>
        </div>
        <div className="form-group">
          <Label htmlFor={id('estadoCivil')}>Estado Civil</Label>
          <select id={id('estadoCivil')} name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className="form-select">
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
          <Label htmlFor={id('dataNascimento')}>Data de Nascimento</Label>
          <Input type="date" id={id('dataNascimento')} name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="form-input" />
        </div>
        <div className="form-group">
          <Label htmlFor={id('telefone')}>Telefone *</Label>
          <Input type="tel" id={id('telefone')} name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" required className="form-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <Label htmlFor={id('email')}>Email</Label>
          <Input type="email" id={id('email')} name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" className="form-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <Label htmlFor={id('cep')}>CEP</Label>
          <Input
            type="text"
            id={id('cep')}
            name="cep"
            value={formData.cep}
            onChange={handleChange}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            className="form-input"
            maxLength={9}
          />
          {onCepBlur && <span className="cep-hint">Digite o CEP e saia do campo para preencher o endereço</span>}
        </div>
      </div>
      <div className="form-row form-row-2">
        <div className="form-group" style={{ flex: 2 }}>
          <Label htmlFor={id('rua')}>Rua</Label>
          <Input type="text" id={id('rua')} name="rua" value={formData.rua} onChange={handleChange} placeholder="Digite o nome da rua" className="form-input" />
        </div>
        <div className="form-group">
          <Label htmlFor={id('numero')}>Número</Label>
          <Input type="text" id={id('numero')} name="numero" value={formData.numero} onChange={handleChange} placeholder="Nº" className="form-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <Label htmlFor={id('complemento')}>Complemento</Label>
          <Input type="text" id={id('complemento')} name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apartamento, bloco, etc. (opcional)" className="form-input" />
        </div>
      </div>
      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor={id('bairro')}>Bairro</Label>
          <Input type="text" id={id('bairro')} name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Digite o bairro" className="form-input" />
        </div>
        <div className="form-group">
          <Label htmlFor={id('cidade')}>Cidade</Label>
          <Input type="text" id={id('cidade')} name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Digite a cidade" className="form-input" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <Label htmlFor={id('estado')}>Estado</Label>
          <select id={id('estado')} name="estado" value={formData.estado} onChange={handleChange} className="form-select">
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
          <Button type="button" variant="outline" onClick={onCancel} className="cancel-button">Cancelar</Button>
        )}
        <Button type="submit" className="submit-button" disabled={loading}>{loading ? 'Salvando...' : submitText}</Button>
      </div>
    </form>
  );
}

const GestaoPessoas = () => {
  const { toast } = useToast();

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

  // Estados para lista de pessoas
  const [activeTab, setActiveTab] = useState('gestao-pessoas');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pessoaParaExcluir, setPessoaParaExcluir] = useState(null);
  const [listFilters, setListFilters] = useState({
    search: '',
    cidade: '',
    estado: '',
    sexo: ''
  });
  const [currentPageList, setCurrentPageList] = useState(1);
  const [pageSizeList, setPageSizeList] = useState(10);
  const [totalPessoas, setTotalPessoas] = useState(0);

  // Lista de pessoas (carregada da API)
  const [pessoas, setPessoas] = useState([]);
  const [pessoasBusca, setPessoasBusca] = useState([]); // Para busca/autocomplete

  // Lista de ministérios
  const [ministerios, setMinisterios] = useState([]);

  // Carregar pessoas
  const loadPessoas = async () => {
    try {
      const response = await api.get('/pessoas', {
        params: {
          ...listFilters,
          page: currentPageList,
          pageSize: pageSizeList
        }
      });
      setPessoas(response.data.pessoas);
      setTotalPessoas(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pessoas. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Carregar ministérios
  const loadMinisterios = async () => {
    try {
      const response = await api.get('/ministerios');
      setMinisterios(response.data.ministerios);
    } catch (error) {
      console.error('Erro ao carregar ministérios:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar ministérios. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Buscar pessoas (para autocomplete)
  const buscarPessoasAPI = async (query) => {
    if (!query || query.trim().length < 2) {
      setPessoasBusca([]);
      return;
    }

    try {
      const response = await api.get('/pessoas/buscar', {
        params: { q: query }
      });
      setPessoasBusca(response.data.pessoas);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
      setPessoasBusca([]);
    }
  };

  // Recarregar pessoas quando filtros ou paginação mudarem
  useEffect(() => {
    loadPessoas();
  }, [currentPageList, pageSizeList, listFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório.', variant: 'destructive' });
      return;
    }
    if (!formData.telefone.trim()) {
      toast({ title: 'Erro', description: 'Telefone é obrigatório.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      await api.post('/pessoas', formData);
      toast({
        title: 'Sucesso',
        description: 'Pessoa cadastrada com sucesso!',
        variant: 'success',
      });
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
      await loadPessoas();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao cadastrar pessoa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar pessoas quando searchQuery mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarPessoasAPI(searchQuery);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filtrar pessoas para pesquisa (usando resultado da API)
  const filteredPessoas = pessoasBusca;

  // Preencher formulário quando pessoa for selecionada
  const handleSelectPerson = async (pessoa) => {
    try {
      const response = await api.get(`/pessoas/${pessoa.id}`);
      const pessoaData = response.data.pessoa;
      setSelectedPerson(pessoaData);
      setEditFormData({
        nome: pessoaData.nome || '',
        sobrenome: pessoaData.sobrenome || '',
        sexo: pessoaData.sexo || '',
        estadoCivil: pessoaData.estadoCivil || '',
        dataNascimento: pessoaData.dataNascimento || '',
        telefone: pessoaData.telefone || '',
        email: pessoaData.email || '',
        cep: pessoaData.cep || '',
        rua: pessoaData.rua || '',
        numero: pessoaData.numero || '',
        complemento: pessoaData.complemento || '',
        bairro: pessoaData.bairro || '',
        cidade: pessoaData.cidade || '',
        estado: pessoaData.estado || ''
      });
      setSearchQuery('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pessoa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ViaCEP: busca endereço pelo CEP e preenche o formulário
  const fetchViaCep = async (cep) => {
    try {
      const res = await fetch(`${VIA_CEP_URL}/${cep.replace(/\D/g, '')}/json/`);
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

  const handleCepBlurAdd = async (cep) => {
    const endereco = await fetchViaCep(cep);
    if (endereco) {
      setFormData(prev => ({ ...prev, ...endereco }));
      toast({ title: 'CEP encontrado', description: 'Endereço preenchido automaticamente.', variant: 'success', });
    } else {
      toast({ title: 'CEP não encontrado', description: 'Verifique o número e tente novamente.', variant: 'destructive' });
    }
  };

  const handleCepBlurEdit = async (cep) => {
    const endereco = await fetchViaCep(cep);
    if (endereco) {
      setEditFormData(prev => ({ ...prev, ...endereco }));
      toast({ title: 'CEP encontrado', description: 'Endereço preenchido automaticamente.', variant: 'success', });
    } else {
      toast({ title: 'CEP não encontrado', description: 'Verifique o número e tente novamente.', variant: 'destructive' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.nome.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório.', variant: 'destructive' });
      return;
    }
    if (!editFormData.telefone.trim()) {
      toast({ title: 'Erro', description: 'Telefone é obrigatório.', variant: 'destructive' });
      return;
    }
    setLoadingEdit(true);

    if (!selectedPerson) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma pessoa para editar.',
        variant: 'destructive',
      });
      setLoadingEdit(false);
      return;
    }

    try {
      await api.put(`/pessoas/${selectedPerson.id}`, editFormData);
      toast({
        title: 'Sucesso',
        description: 'Pessoa atualizada com sucesso!',
        variant: 'success',
      });
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
      await loadPessoas();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar pessoa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
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
  };

  // Paginação da lista (usando dados do backend)
  const totalPagesList = useMemo(() => 
    Math.ceil(totalPessoas / pageSizeList), 
    [totalPessoas, pageSizeList]
  );
  const startIndexList = useMemo(() => 
    (currentPageList - 1) * pageSizeList, 
    [currentPageList, pageSizeList]
  );
  const endIndexList = useMemo(() => 
    Math.min(startIndexList + pageSizeList, totalPessoas), 
    [startIndexList, pageSizeList, totalPessoas]
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

  // Abrir dialog de exclusão
  const handleDeleteClick = (id) => {
    setPessoaParaExcluir(id);
    setDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!pessoaParaExcluir) return;

    try {
      await api.delete(`/pessoas/${pessoaParaExcluir}`);
      toast({
        title: 'Sucesso',
        description: 'Pessoa excluída com sucesso!',
        variant: 'success',
      });
      // Se a pessoa excluída estava selecionada, limpar seleção
      if (selectedPerson?.id === pessoaParaExcluir) {
        handleClearSelection();
      }
      setDeleteDialogOpen(false);
      setPessoaParaExcluir(null);
      await loadPessoas();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir pessoa. Tente novamente.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      setPessoaParaExcluir(null);
    }
  };

  // Obter lista única de cidades para filtro (será carregada do backend se necessário)
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
  const [cargosEclesiasticos, setCargosEclesiasticos] = useState([]);
  const [estagiosEspirituais, setEstagiosEspirituais] = useState([]);
  const [tiposAcesso, setTiposAcesso] = useState([]);

  // Carregar opções da tab Atribuição do banco (cargos, estágios, tipos de acesso, ministérios)
  // Ministérios: mesmo endpoint e parâmetro do Config System > tab Ministérios (todos os cadastrados)
  useEffect(() => {
    const carregarOpcoesAtribuicao = async () => {
      try {
        const [cargosRes, estagiosRes, tiposRes, ministeriosRes] = await Promise.all([
          api.get('/cargos-eclesiasticos'),
          api.get('/estagios-espirituais'),
          api.get('/tipos-acesso'),
          api.get('/ministerios', { params: { incluirInativos: true } }),
        ]);
        setCargosEclesiasticos(cargosRes.data.cargos || []);
        setEstagiosEspirituais(estagiosRes.data.estagios || []);
        setTiposAcesso(tiposRes.data.tipos || []);
        setMinisterios(ministeriosRes.data.ministerios || []);
      } catch (error) {
        console.error('Erro ao carregar opções de atribuição:', error);
        toast({
          title: 'Aviso',
          description: 'Não foi possível carregar algumas opções. Tente recarregar a página.',
          variant: 'destructive',
        });
      }
    };
    carregarOpcoesAtribuicao();
  }, []);

  // Buscar pessoas para atribuição
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarPessoasAPI(atribuicaoSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [atribuicaoSearchQuery]);

  const filteredPessoasAtribuicao = pessoasBusca;

  // Preencher formulário quando pessoa for selecionada na atribuição
  const handleSelectPersonAtribuicao = async (pessoa) => {
    setSelectedPersonAtribuicao(pessoa);
    setAtribuicaoSearchQuery('');
    
    // Carregar atribuições existentes
    try {
      const response = await api.get(`/pessoas/${pessoa.id}/atribuicoes`);
      const atribuicao = response.data.atribuicao;
      
      // Garantir que sempre seja array de números (IDs)
      let ministeriosLiderArray = [];
      if (atribuicao.ministeriosLider) {
        if (Array.isArray(atribuicao.ministeriosLider)) {
          ministeriosLiderArray = atribuicao.ministeriosLider.map(m => {
            if (typeof m === 'object' && m !== null && m.id !== undefined) {
              return Number(m.id);
            }
            return Number(m);
          }).filter(id => !isNaN(id));
        } else if (typeof atribuicao.ministeriosLider === 'number') {
          ministeriosLiderArray = [Number(atribuicao.ministeriosLider)];
        }
      }
      
      let ministeriosParticipanteArray = [];
      if (atribuicao.ministeriosParticipante) {
        if (Array.isArray(atribuicao.ministeriosParticipante)) {
          ministeriosParticipanteArray = atribuicao.ministeriosParticipante.map(m => {
            if (typeof m === 'object' && m !== null && m.id !== undefined) {
              return Number(m.id);
            }
            return Number(m);
          }).filter(id => !isNaN(id));
        } else if (typeof atribuicao.ministeriosParticipante === 'number') {
          ministeriosParticipanteArray = [Number(atribuicao.ministeriosParticipante)];
        }
      }
      
      setAtribuicaoFormData({
        cargoEclesiastico: atribuicao.cargoEclesiastico || '',
        estagiosUsuario: Array.isArray(atribuicao.estagiosUsuario) ? atribuicao.estagiosUsuario : [],
        ministeriosLider: ministeriosLiderArray,
        ministeriosParticipante: ministeriosParticipanteArray,
        tipoUsuario: atribuicao.tipoUsuario || 'Usuario'
      });
    } catch (error) {
      // Se não houver atribuições, usar valores padrão
      setAtribuicaoFormData({
        cargoEclesiastico: '',
        estagiosUsuario: [],
        ministeriosLider: [],
        ministeriosParticipante: [],
        tipoUsuario: 'Usuario'
      });
    }
  };

  const handleAtribuicaoChange = (e) => {
    const { name, value } = e.target;
    setAtribuicaoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Estados para tab Acompanhamento
  const [acompanhamentoPessoaQuery, setAcompanhamentoPessoaQuery] = useState('');
  const [pessoaAcompanhamentoSelecionada, setPessoaAcompanhamentoSelecionada] = useState(null);
  const [acompanhantesList, setAcompanhantesList] = useState([]); // [{ id, nome }]
  const [visibilidadeList, setVisibilidadeList] = useState([]); // [{ id, nome }]
  const [acompanhantesAddQuery, setAcompanhantesAddQuery] = useState('');
  const [acompanhantesBuscaResults, setAcompanhantesBuscaResults] = useState([]);
  const [visibilidadeAddQuery, setVisibilidadeAddQuery] = useState('');
  const [visibilidadeBuscaResults, setVisibilidadeBuscaResults] = useState([]);
  const [acompanhamentos, setAcompanhamentos] = useState([]);
  const [totalAcompanhamentos, setTotalAcompanhamentos] = useState(0);
  const [pageAcompanhamentos, setPageAcompanhamentos] = useState(1);
  const [pageSizeAcompanhamentos, setPageSizeAcompanhamentos] = useState(10);
  const [loadingAcompanhamento, setLoadingAcompanhamento] = useState(false);
  const [dialogAcompanhamentoAcao, setDialogAcompanhamentoAcao] = useState(null); // 'arquivar' | 'excluir'
  const [acompanhamentoAcaoId, setAcompanhamentoAcaoId] = useState(null);
  const [acompanhamentoAcaoNome, setAcompanhamentoAcaoNome] = useState('');
  const [modalAcompanhamentoOpen, setModalAcompanhamentoOpen] = useState(false);
  const [modalAcompanhamentoData, setModalAcompanhamentoData] = useState(null);
  const [loadingModalAcompanhamento, setLoadingModalAcompanhamento] = useState(false);
  const [savingModalAcompanhamento, setSavingModalAcompanhamento] = useState(false);
  const [acompanhamentoPessoaBusca, setAcompanhamentoPessoaBusca] = useState([]);
  const [modalAcompAcompanhanteQuery, setModalAcompAcompanhanteQuery] = useState('');
  const [modalAcompVisibilidadeQuery, setModalAcompVisibilidadeQuery] = useState('');
  const [modalAcompAcompanhanteBusca, setModalAcompAcompanhanteBusca] = useState([]);
  const [modalAcompVisibilidadeBusca, setModalAcompVisibilidadeBusca] = useState([]);

  // Estados para seleção de estágios e ministérios
  const [estagioSelecionado, setEstagioSelecionado] = useState('');
  const [ministerioLiderSelecionado, setMinisterioLiderSelecionado] = useState('');
  const [ministerioParticipanteSelecionado, setMinisterioParticipanteSelecionado] = useState('');

  const handleAdicionarEstagio = () => {
    if (estagioSelecionado && !atribuicaoFormData.estagiosUsuario.includes(estagioSelecionado)) {
      setAtribuicaoFormData(prev => ({
        ...prev,
        estagiosUsuario: [...prev.estagiosUsuario, estagioSelecionado]
      }));
      setEstagioSelecionado('');
    }
  };

  const handleRemoverEstagio = (estagio) => {
    setAtribuicaoFormData(prev => ({
      ...prev,
      estagiosUsuario: prev.estagiosUsuario.filter(e => e !== estagio)
    }));
  };

  const handleAdicionarMinisterioLider = () => {
    if (ministerioLiderSelecionado && !atribuicaoFormData.ministeriosLider.includes(Number(ministerioLiderSelecionado))) {
      // Verificar se já não é participante deste ministério
      if (atribuicaoFormData.ministeriosParticipante.includes(Number(ministerioLiderSelecionado))) {
        toast({
          title: 'Aviso',
          description: 'Esta pessoa já é participante deste ministério. Remova da lista de participantes primeiro.',
          variant: 'destructive',
        });
        return;
      }
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
      // Verificar se já não é líder deste ministério
      if (atribuicaoFormData.ministeriosLider.includes(Number(ministerioParticipanteSelecionado))) {
        toast({
          title: 'Aviso',
          description: 'Esta pessoa já é líder deste ministério. Remova da lista de líderes primeiro.',
          variant: 'destructive',
        });
        return;
      }
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

    if (!selectedPersonAtribuicao) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma pessoa para atribuir.',
        variant: 'destructive',
      });
      setLoadingAtribuicao(false);
      return;
    }

    if (atribuicaoFormData.estagiosUsuario.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione pelo menos um estágio de usuário.',
        variant: 'destructive',
      });
      setLoadingAtribuicao(false);
      return;
    }

    // Garantir que ministeriosLider e ministeriosParticipante sejam arrays de números
    const dadosParaEnviar = {
      ...atribuicaoFormData,
      ministeriosLider: Array.isArray(atribuicaoFormData.ministeriosLider) 
        ? atribuicaoFormData.ministeriosLider.map(id => Number(id)).filter(id => !isNaN(id))
        : [],
      ministeriosParticipante: Array.isArray(atribuicaoFormData.ministeriosParticipante)
        ? atribuicaoFormData.ministeriosParticipante.map(id => Number(id)).filter(id => !isNaN(id))
        : []
    };

    try {
      const response = await api.post(`/pessoas/${selectedPersonAtribuicao.id}/atribuicoes`, dadosParaEnviar);
      
      // Recarregar os dados atualizados do backend
      const atribuicao = response.data.atribuicao;
      
      // Garantir que sempre seja array de números (IDs)
      let ministeriosLiderArray = [];
      if (atribuicao.ministeriosLider) {
        if (Array.isArray(atribuicao.ministeriosLider)) {
          ministeriosLiderArray = atribuicao.ministeriosLider.map(m => {
            if (typeof m === 'object' && m !== null && m.id !== undefined) {
              return Number(m.id);
            }
            return Number(m);
          }).filter(id => !isNaN(id));
        } else if (typeof atribuicao.ministeriosLider === 'number') {
          ministeriosLiderArray = [Number(atribuicao.ministeriosLider)];
        }
      }
      
      let ministeriosParticipanteArray = [];
      if (atribuicao.ministeriosParticipante) {
        if (Array.isArray(atribuicao.ministeriosParticipante)) {
          ministeriosParticipanteArray = atribuicao.ministeriosParticipante.map(m => {
            if (typeof m === 'object' && m !== null && m.id !== undefined) {
              return Number(m.id);
            }
            return Number(m);
          }).filter(id => !isNaN(id));
        } else if (typeof atribuicao.ministeriosParticipante === 'number') {
          ministeriosParticipanteArray = [Number(atribuicao.ministeriosParticipante)];
        }
      }
      
      setAtribuicaoFormData({
        cargoEclesiastico: atribuicao.cargoEclesiastico || '',
        estagiosUsuario: Array.isArray(atribuicao.estagiosUsuario) ? atribuicao.estagiosUsuario : [],
        ministeriosLider: ministeriosLiderArray,
        ministeriosParticipante: ministeriosParticipanteArray,
        tipoUsuario: atribuicao.tipoUsuario || 'Usuario'
      });
      
      toast({
        title: 'Sucesso',
        description: 'Atribuições salvas com sucesso!',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar atribuições. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
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
    setEstagioSelecionado('');
    setMinisterioLiderSelecionado('');
    setMinisterioParticipanteSelecionado('');
  };

  // Acompanhamento: buscar pessoa (primeiro campo)
  useEffect(() => {
    if (!acompanhamentoPessoaQuery || acompanhamentoPessoaQuery.trim().length < 2) {
      setAcompanhamentoPessoaBusca([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/pessoas/buscar', { params: { q: acompanhamentoPessoaQuery } })
        .then((res) => setAcompanhamentoPessoaBusca(res.data.pessoas || []))
        .catch(() => setAcompanhamentoPessoaBusca([]));
    }, 300);
    return () => clearTimeout(t);
  }, [acompanhamentoPessoaQuery]);

  // Acompanhamento: buscar para adicionar acompanhante
  useEffect(() => {
    if (!acompanhantesAddQuery || acompanhantesAddQuery.trim().length < 2) {
      setAcompanhantesBuscaResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/pessoas/buscar', { params: { q: acompanhantesAddQuery } })
        .then((res) => setAcompanhantesBuscaResults(res.data.pessoas || []))
        .catch(() => setAcompanhantesBuscaResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [acompanhantesAddQuery]);

  // Acompanhamento: buscar para adicionar visibilidade
  useEffect(() => {
    if (!visibilidadeAddQuery || visibilidadeAddQuery.trim().length < 2) {
      setVisibilidadeBuscaResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/pessoas/buscar', { params: { q: visibilidadeAddQuery } })
        .then((res) => setVisibilidadeBuscaResults(res.data.pessoas || []))
        .catch(() => setVisibilidadeBuscaResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [visibilidadeAddQuery]);

  const loadAcompanhamentos = async (pagina = pageAcompanhamentos, pageSize = pageSizeAcompanhamentos) => {
    try {
      const res = await api.get('/acompanhamento', { params: { page: pagina, limit: pageSize } });
      setAcompanhamentos(res.data.acompanhamentos || []);
      setTotalAcompanhamentos(res.data.total ?? 0);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Erro ao carregar acompanhamentos.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (activeTab === 'acompanhamento') loadAcompanhamentos(pageAcompanhamentos, pageSizeAcompanhamentos);
  }, [activeTab, pageAcompanhamentos, pageSizeAcompanhamentos]);

  const totalPagesAcompanhamentos = Math.max(1, Math.ceil(totalAcompanhamentos / pageSizeAcompanhamentos));
  const startAcompanhamentos = (pageAcompanhamentos - 1) * pageSizeAcompanhamentos + 1;
  const endAcompanhamentos = Math.min(pageAcompanhamentos * pageSizeAcompanhamentos, totalAcompanhamentos);

  const handleArquivarAcompanhamentoClick = (id, nomePessoa) => {
    setAcompanhamentoAcaoId(id);
    setAcompanhamentoAcaoNome(nomePessoa);
    setDialogAcompanhamentoAcao('arquivar');
  };

  const handleExcluirAcompanhamentoClick = (id, nomePessoa) => {
    setAcompanhamentoAcaoId(id);
    setAcompanhamentoAcaoNome(nomePessoa);
    setDialogAcompanhamentoAcao('excluir');
  };

  const handleConfirmarAcaoAcompanhamento = async () => {
    if (!acompanhamentoAcaoId) return;
    try {
      if (dialogAcompanhamentoAcao === 'arquivar') {
        await api.patch(`/acompanhamento/${acompanhamentoAcaoId}/arquivar`);
        toast({ title: 'Sucesso', description: 'Acompanhamento arquivado.', variant: 'success' });
      } else {
        await api.delete(`/acompanhamento/${acompanhamentoAcaoId}`);
        toast({ title: 'Sucesso', description: 'Acompanhamento excluído.', variant: 'success' });
      }
      setDialogAcompanhamentoAcao(null);
      setAcompanhamentoAcaoId(null);
      setAcompanhamentoAcaoNome('');
      if (modalAcompanhamentoOpen && modalAcompanhamentoData?.id === acompanhamentoAcaoId) {
        setModalAcompanhamentoOpen(false);
      }
      loadAcompanhamentos(pageAcompanhamentos, pageSizeAcompanhamentos);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || (dialogAcompanhamentoAcao === 'arquivar' ? 'Erro ao arquivar.' : 'Erro ao excluir.'),
        variant: 'destructive'
      });
    }
  };

  // Modal: busca para adicionar acompanhante
  useEffect(() => {
    if (!modalAcompanhamentoOpen || !modalAcompAcompanhanteQuery || modalAcompAcompanhanteQuery.trim().length < 2) {
      setModalAcompAcompanhanteBusca([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/pessoas/buscar', { params: { q: modalAcompAcompanhanteQuery } })
        .then((res) => setModalAcompAcompanhanteBusca(res.data.pessoas || []))
        .catch(() => setModalAcompAcompanhanteBusca([]));
    }, 300);
    return () => clearTimeout(t);
  }, [modalAcompanhamentoOpen, modalAcompAcompanhanteQuery]);

  // Modal: busca para adicionar visibilidade
  useEffect(() => {
    if (!modalAcompanhamentoOpen || !modalAcompVisibilidadeQuery || modalAcompVisibilidadeQuery.trim().length < 2) {
      setModalAcompVisibilidadeBusca([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/pessoas/buscar', { params: { q: modalAcompVisibilidadeQuery } })
        .then((res) => setModalAcompVisibilidadeBusca(res.data.pessoas || []))
        .catch(() => setModalAcompVisibilidadeBusca([]));
    }, 300);
    return () => clearTimeout(t);
  }, [modalAcompanhamentoOpen, modalAcompVisibilidadeQuery]);

  const handleSelectPessoaAcompanhamento = (pessoa) => {
    setPessoaAcompanhamentoSelecionada(pessoa);
    setAcompanhamentoPessoaQuery('');
    setAcompanhamentoPessoaBusca([]);
  };

  const handleCriarAcompanhamento = async (e) => {
    e.preventDefault();
    if (!pessoaAcompanhamentoSelecionada) {
      toast({ title: 'Erro', description: 'Selecione a pessoa a ser acompanhada.', variant: 'destructive' });
      return;
    }
    setLoadingAcompanhamento(true);
    try {
      await api.post('/acompanhamento', {
        pessoaId: pessoaAcompanhamentoSelecionada.id,
        acompanhantesIds: acompanhantesList.map((p) => p.id),
        visibilidadeIds: visibilidadeList.map((p) => p.id)
      });
      toast({ title: 'Sucesso', description: 'Acompanhamento criado com sucesso!', variant: 'success' });
      setPessoaAcompanhamentoSelecionada(null);
      setAcompanhantesList([]);
      setVisibilidadeList([]);
      setAcompanhantesAddQuery('');
      setVisibilidadeAddQuery('');
      setAcompanhantesBuscaResults([]);
      setVisibilidadeBuscaResults([]);
      loadAcompanhamentos();
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao criar acompanhamento.',
        variant: 'destructive'
      });
    } finally {
      setLoadingAcompanhamento(false);
    }
  };

  const handleOpenModalAcompanhamento = async (id) => {
    setModalAcompanhamentoOpen(true);
    setModalAcompanhamentoData(null);
    setModalAcompAcompanhanteQuery('');
    setModalAcompVisibilidadeQuery('');
    setModalAcompAcompanhanteBusca([]);
    setModalAcompVisibilidadeBusca([]);
    setLoadingModalAcompanhamento(true);
    try {
      const res = await api.get(`/acompanhamento/${id}`);
      setModalAcompanhamentoData(res.data);
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao carregar acompanhamento.', variant: 'destructive' });
      setModalAcompanhamentoOpen(false);
    } finally {
      setLoadingModalAcompanhamento(false);
    }
  };

  const handleSaveModalAcompanhamento = async () => {
    if (!modalAcompanhamentoData) return;
    setSavingModalAcompanhamento(true);
    try {
      await api.put(`/acompanhamento/${modalAcompanhamentoData.id}`, {
        acompanhantesIds: modalAcompanhamentoData.acompanhantes.map((p) => p.id),
        visibilidadeIds: modalAcompanhamentoData.visibilidade.map((p) => p.id)
      });
      toast({ title: 'Sucesso', description: 'Acompanhamento atualizado.', variant: 'success' });
      setModalAcompanhamentoOpen(false);
      loadAcompanhamentos(pageAcompanhamentos, pageSizeAcompanhamentos);
    } catch (err) {
      toast({ title: 'Erro', description: err.response?.data?.message || 'Erro ao salvar.', variant: 'destructive' });
    } finally {
      setSavingModalAcompanhamento(false);
    }
  };

  const formatarData = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <BackToDashboard />
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
              <TabsTrigger value="acompanhamento" className="gestao-pessoas-tabs-trigger">
                <ClipboardList className="tab-icon" />
                <span>Acompanhamento</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="gestao-pessoas" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Cadastrar Pessoa</h2>
                <PessoaForm
                  formData={formData}
                  handleChange={handleChange}
                  loading={loading}
                  submitText="Cadastrar Pessoa"
                  cancelButton={false}
                  onSubmit={handleSubmit}
                  idPrefix={PREFIX_ADD}
                  onCepBlur={handleCepBlurAdd}
                />
              </div>
            </TabsContent>

            <TabsContent value="editar-pessoas" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Editar Pessoa</h2>
                <div className="search-section">
                  <Label htmlFor="search-pessoa-edit">Buscar pessoa para editar</Label>
                  <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <Input
                      type="text"
                      id="search-pessoa-edit"
                      placeholder="Digite o nome, email ou telefone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input search-input"
                    />
                  </div>
                  {filteredPessoas.length > 0 && (
                    <div className="search-results-dropdown">
                      {filteredPessoas.map((pessoa) => (
                        <div
                          key={pessoa.id}
                          className="search-result-item"
                          onClick={() => handleSelectPerson(pessoa)}
                        >
                          <span className="result-name">{pessoa.nomeCompleto || `${pessoa.nome} ${pessoa.sobrenome}`}</span>
                          {pessoa.email && <span className="result-email">{pessoa.email}</span>}
                          {pessoa.telefone && <span className="result-phone">{pessoa.telefone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPerson && (
                  <div className="edit-form-section">
                    <PessoaForm
                      formData={editFormData}
                      handleChange={handleEditChange}
                      loading={loadingEdit}
                      submitText="Atualizar Pessoa"
                      cancelButton={true}
                      onCancel={handleClearSelection}
                      onSubmit={handleEditSubmit}
                      idPrefix={PREFIX_EDIT}
                      onCepBlur={handleCepBlurEdit}
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
                        {pessoas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center">
                              Nenhuma pessoa encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          pessoas.map((pessoa) => (
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
                                    onClick={() => handleDeleteClick(pessoa.id)}
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
                  {totalPessoas > pageSizeList && (
                    <div className="pagination-section">
                      <div className="pagination-info">
                        <span>
                          Mostrando {startIndexList + 1} a {endIndexList} de {totalPessoas} pessoas
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
                          {cargosEclesiasticos.map((cargo) => (
                            <option key={cargo} value={cargo}>
                              {cargo}
                            </option>
                          ))}
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
                              {estagiosEspirituais
                                .filter(estagio => {
                                  const valorFront = estagio === 'Participante' ? 'Participante de Ministério' : estagio;
                                  return !atribuicaoFormData.estagiosUsuario.includes(valorFront);
                                })
                                .map(estagio => (
                                  <option key={estagio} value={estagio === 'Participante' ? 'Participante de Ministério' : estagio}>
                                    {estagio === 'Participante' ? 'Participante de Ministério' : estagio}
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
                                <option value="">
                                  {ministerios.length === 0 ? 'Carregando ministérios...' : 'Selecione um ministério'}
                                </option>
                                {ministerios
                                  .filter(m => !atribuicaoFormData.ministeriosLider.includes(m.id) && !atribuicaoFormData.ministeriosParticipante.includes(m.id))
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
                                <option value="">
                                  {ministerios.length === 0 ? 'Carregando ministérios...' : 'Selecione um ministério'}
                                </option>
                                {ministerios
                                  .filter(m => !atribuicaoFormData.ministeriosParticipante.includes(m.id) && !atribuicaoFormData.ministeriosLider.includes(m.id))
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
                          {tiposAcesso.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo === 'Usuario' ? 'Usuário' : tipo === 'Lider' ? 'Líder' : tipo}
                            </option>
                          ))}
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

            <TabsContent value="acompanhamento" className="gestao-pessoas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Acompanhamento</h2>

                <div className="search-section">
                  <Label htmlFor="search-pessoa-acompanhamento">Buscar pessoa a ser acompanhada</Label>
                  <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <Input
                      type="text"
                      id="search-pessoa-acompanhamento"
                      placeholder="Digite o nome, email ou telefone..."
                      value={acompanhamentoPessoaQuery}
                      onChange={(e) => setAcompanhamentoPessoaQuery(e.target.value)}
                      className="form-input search-input"
                      disabled={!!pessoaAcompanhamentoSelecionada}
                    />
                  </div>
                  {acompanhamentoPessoaQuery.trim().length >= 2 && !pessoaAcompanhamentoSelecionada && (
                    <>
                      {acompanhamentoPessoaBusca.length > 0 ? (
                        <div className="search-results-dropdown">
                          {acompanhamentoPessoaBusca.map((pessoa) => (
                            <div
                              key={pessoa.id}
                              className="search-result-item"
                              onClick={() => handleSelectPessoaAcompanhamento(pessoa)}
                            >
                              <span className="result-name">{pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim()}</span>
                              {pessoa.email && <span className="result-email">{pessoa.email}</span>}
                              {pessoa.telefone && <span className="result-phone">{pessoa.telefone}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="search-no-results">Nenhuma pessoa encontrada. Digite nome, e-mail ou telefone.</div>
                      )}
                    </>
                  )}
                  {pessoaAcompanhamentoSelecionada && (
                    <div className="selected-person">
                      <div className="selected-person-info">
                        <div className="selected-person-name">
                          {pessoaAcompanhamentoSelecionada.nome} {pessoaAcompanhamentoSelecionada.sobrenome}
                        </div>
                      </div>
                      <Button type="button" variant="outline" onClick={() => { setPessoaAcompanhamentoSelecionada(null); setAcompanhantesList([]); setVisibilidadeList([]); }} className="clear-selection-button">
                        Limpar
                      </Button>
                    </div>
                  )}
                </div>

                {pessoaAcompanhamentoSelecionada && (
                  <form onSubmit={handleCriarAcompanhamento} className="pessoa-form">
                    <div className="form-row">
                      <div className="form-group">
                        <Label>Acompanhantes (editam o relatório)</Label>
                        <div className="autores-wrapper">
                          <div className="search-input-wrapper" style={{ marginBottom: 8 }}>
                            <Search className="search-icon" />
                            <Input
                              type="text"
                              placeholder="Buscar pessoa para adicionar como acompanhante..."
                              value={acompanhantesAddQuery}
                              onChange={(e) => setAcompanhantesAddQuery(e.target.value)}
                              className="form-input search-input"
                            />
                          </div>
                          {acompanhantesAddQuery.trim().length >= 2 && (
                            <>
                              {acompanhantesBuscaResults.filter((p) => !acompanhantesList.some((a) => a.id === p.id)).length > 0 ? (
                                <div className="search-results-dropdown">
                                  {acompanhantesBuscaResults
                                    .filter((p) => !acompanhantesList.some((a) => a.id === p.id))
                                    .map((pessoa) => (
                                      <div
                                        key={pessoa.id}
                                        className="search-result-item"
                                        onClick={() => {
                                          const nome = pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim();
                                          setAcompanhantesList((prev) => [...prev, { id: pessoa.id, nome }]);
                                          setAcompanhantesAddQuery('');
                                          setAcompanhantesBuscaResults([]);
                                        }}
                                      >
                                        <span className="result-name">{pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim()}</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="search-no-results">Nenhuma pessoa encontrada.</div>
                              )}
                            </>
                          )}
                          {acompanhantesList.length > 0 && (
                            <div className="autores-list">
                              <Label>Acompanhantes adicionados:</Label>
                              <div className="autores-tags">
                                {acompanhantesList.map((p) => (
                                  <div key={p.id} className="autor-tag">
                                    <span>{p.nome}</span>
                                    <button type="button" onClick={() => setAcompanhantesList((prev) => prev.filter((x) => x.id !== p.id))} className="remove-autor-button">
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
                    <div className="form-row">
                      <div className="form-group">
                        <Label>Pessoas com visibilidade de leitura</Label>
                        <div className="autores-wrapper">
                          <div className="search-input-wrapper" style={{ marginBottom: 8 }}>
                            <Search className="search-icon" />
                            <Input
                              type="text"
                              placeholder="Buscar pessoa para adicionar visibilidade..."
                              value={visibilidadeAddQuery}
                              onChange={(e) => setVisibilidadeAddQuery(e.target.value)}
                              className="form-input search-input"
                            />
                          </div>
                          {visibilidadeAddQuery.trim().length >= 2 && (
                            <>
                              {visibilidadeBuscaResults.filter((p) => !visibilidadeList.some((v) => v.id === p.id)).length > 0 ? (
                                <div className="search-results-dropdown">
                                  {visibilidadeBuscaResults
                                    .filter((p) => !visibilidadeList.some((v) => v.id === p.id))
                                    .map((pessoa) => (
                                      <div
                                        key={pessoa.id}
                                        className="search-result-item"
                                        onClick={() => {
                                          const nome = pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim();
                                          setVisibilidadeList((prev) => [...prev, { id: pessoa.id, nome }]);
                                          setVisibilidadeAddQuery('');
                                          setVisibilidadeBuscaResults([]);
                                        }}
                                      >
                                        <span className="result-name">{pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim()}</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="search-no-results">Nenhuma pessoa encontrada.</div>
                              )}
                            </>
                          )}
                          {visibilidadeList.length > 0 && (
                            <div className="autores-list">
                              <Label>Visibilidade adicionada:</Label>
                              <div className="autores-tags">
                                {visibilidadeList.map((p) => (
                                  <div key={p.id} className="autor-tag">
                                    <span>{p.nome}</span>
                                    <button type="button" onClick={() => setVisibilidadeList((prev) => prev.filter((x) => x.id !== p.id))} className="remove-autor-button">
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
                    <div className="form-actions">
                      <Button type="submit" className="submit-button" disabled={loadingAcompanhamento}>
                        {loadingAcompanhamento ? 'Criando...' : 'Criar acompanhamento'}
                      </Button>
                    </div>
                  </form>
                )}

                <div className="pessoas-table-container" style={{ marginTop: 24 }}>
                  <h3>Acompanhamentos criados</h3>
                  <div className="table-wrapper">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data de criação</TableHead>
                          <TableHead>Nome da pessoa acompanhada</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {acompanhamentos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center">
                              Nenhum acompanhamento cadastrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          acompanhamentos.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{formatarData(a.criadoEm)}</TableCell>
                              <TableCell>{a.nomePessoa}</TableCell>
                              <TableCell className="text-right">
                                <div className="acompanhamento-acoes-cell">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenModalAcompanhamento(a.id)}
                                    title="Abrir detalhes"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleArquivarAcompanhamentoClick(a.id, a.nomePessoa)}
                                    title="Arquivar"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleExcluirAcompanhamentoClick(a.id, a.nomePessoa)}
                                    title="Excluir"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  {totalAcompanhamentos > 0 && (
                    <div className="pagination-section acompanhamento-pagination">
                      <div className="pagination-info">
                        <span>
                          Mostrando {startAcompanhamentos} a {endAcompanhamentos} de {totalAcompanhamentos} registros
                        </span>
                        <div className="page-size-selector">
                          <Label htmlFor="acompanhamento-pageSize">Linhas por página:</Label>
                          <select
                            id="acompanhamento-pageSize"
                            value={pageSizeAcompanhamentos}
                            onChange={(e) => {
                              setPageSizeAcompanhamentos(Number(e.target.value));
                              setPageAcompanhamentos(1);
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
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPageAcompanhamentos((p) => Math.max(1, p - 1))}
                          disabled={pageAcompanhamentos <= 1}
                          className="pagination-button"
                        >
                          <ChevronLeft className="h-4 w-4" /> Anterior
                        </Button>
                        <div className="page-numbers">
                          {Array.from({ length: Math.min(5, totalPagesAcompanhamentos) }, (_, i) => {
                            let pageNum;
                            if (totalPagesAcompanhamentos <= 5) pageNum = i + 1;
                            else if (pageAcompanhamentos <= 3) pageNum = i + 1;
                            else if (pageAcompanhamentos >= totalPagesAcompanhamentos - 2) pageNum = totalPagesAcompanhamentos - 4 + i;
                            else pageNum = pageAcompanhamentos - 2 + i;
                            return (
                              <Button
                                key={pageNum}
                                type="button"
                                variant={pageAcompanhamentos === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPageAcompanhamentos(pageNum)}
                                className="pagination-button page-number"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPageAcompanhamentos((p) => Math.min(totalPagesAcompanhamentos, p + 1))}
                          disabled={pageAcompanhamentos >= totalPagesAcompanhamentos}
                          className="pagination-button"
                        >
                          Próxima <ChevronRight className="h-4 w-4" />
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

      {/* Modal Acompanhamento */}
      <Dialog open={modalAcompanhamentoOpen} onOpenChange={setModalAcompanhamentoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do acompanhamento</DialogTitle>
            <DialogDescription>
              Edite acompanhantes e pessoas com visibilidade de leitura.
            </DialogDescription>
          </DialogHeader>
          {loadingModalAcompanhamento ? (
            <p>Carregando...</p>
          ) : modalAcompanhamentoData ? (
            <div className="acompanhamento-modal-body">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label>Data de criação</Label>
                  <p>{formatarData(modalAcompanhamentoData.criadoEm)}</p>
                </div>
                <div className="form-group">
                  <Label>Pessoa acompanhada</Label>
                  <p><strong>{modalAcompanhamentoData.nomePessoa}</strong></p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label>Acompanhantes</Label>
                  <div className="autores-wrapper">
                    <div className="search-input-wrapper" style={{ marginBottom: 8 }}>
                      <Search className="search-icon" />
                      <Input
                        type="text"
                        placeholder="Buscar para adicionar..."
                        value={modalAcompAcompanhanteQuery}
                        onChange={(e) => setModalAcompAcompanhanteQuery(e.target.value)}
                        className="form-input search-input"
                      />
                    </div>
                    {modalAcompAcompanhanteQuery.trim().length >= 2 && (
                      <>
                        {modalAcompAcompanhanteBusca.filter((p) => !modalAcompanhamentoData.acompanhantes.some((a) => a.id === p.id)).length > 0 ? (
                          <div className="search-results-dropdown">
                            {modalAcompAcompanhanteBusca
                              .filter((p) => !modalAcompanhamentoData.acompanhantes.some((a) => a.id === p.id))
                              .map((pessoa) => (
                                <div
                                  key={pessoa.id}
                                  className="search-result-item"
                                  onClick={() => {
                                    const nome = pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim();
                                    setModalAcompanhamentoData((prev) => prev ? { ...prev, acompanhantes: [...prev.acompanhantes, { id: pessoa.id, nome }] } : null);
                                    setModalAcompAcompanhanteQuery('');
                                    setModalAcompAcompanhanteBusca([]);
                                  }}
                                >
                                  <span className="result-name">{pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim()}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="search-no-results">Nenhuma pessoa encontrada.</div>
                        )}
                      </>
                    )}
                    <div className="autores-list">
                      {modalAcompanhamentoData.acompanhantes.map((p) => (
                        <div key={p.id} className="autor-tag">
                          <span>{p.nome}</span>
                          <button
                            type="button"
                            className="remove-autor-button"
                            onClick={() => setModalAcompanhamentoData((prev) => prev ? { ...prev, acompanhantes: prev.acompanhantes.filter((x) => x.id !== p.id) } : null)}
                          >
                            <X className="remove-icon" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label>Pessoas com visibilidade de leitura</Label>
                  <div className="autores-wrapper">
                    <div className="search-input-wrapper" style={{ marginBottom: 8 }}>
                      <Search className="search-icon" />
                      <Input
                        type="text"
                        placeholder="Buscar para adicionar..."
                        value={modalAcompVisibilidadeQuery}
                        onChange={(e) => setModalAcompVisibilidadeQuery(e.target.value)}
                        className="form-input search-input"
                      />
                    </div>
                    {modalAcompVisibilidadeQuery.trim().length >= 2 && (
                      <>
                        {modalAcompVisibilidadeBusca.filter((p) => !modalAcompanhamentoData.visibilidade.some((v) => v.id === p.id)).length > 0 ? (
                          <div className="search-results-dropdown">
                            {modalAcompVisibilidadeBusca
                              .filter((p) => !modalAcompanhamentoData.visibilidade.some((v) => v.id === p.id))
                              .map((pessoa) => (
                                <div
                                  key={pessoa.id}
                                  className="search-result-item"
                                  onClick={() => {
                                    const nome = pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim();
                                    setModalAcompanhamentoData((prev) => prev ? { ...prev, visibilidade: [...prev.visibilidade, { id: pessoa.id, nome }] } : null);
                                    setModalAcompVisibilidadeQuery('');
                                    setModalAcompVisibilidadeBusca([]);
                                  }}
                                >
                                  <span className="result-name">{pessoa.nomeCompleto || `${pessoa.nome || ''} ${pessoa.sobrenome || ''}`.trim()}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="search-no-results">Nenhuma pessoa encontrada.</div>
                        )}
                      </>
                    )}
                    <div className="autores-list">
                      {modalAcompanhamentoData.visibilidade.map((p) => (
                        <div key={p.id} className="autor-tag">
                          <span>{p.nome}</span>
                          <button
                            type="button"
                            className="remove-autor-button"
                            onClick={() => setModalAcompanhamentoData((prev) => prev ? { ...prev, visibilidade: prev.visibilidade.filter((x) => x.id !== p.id) } : null)}
                          >
                            <X className="remove-icon" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <Button type="button" variant="outline" onClick={() => setModalAcompanhamentoOpen(false)}>Fechar</Button>
                <Button type="button" onClick={handleSaveModalAcompanhamento} disabled={savingModalAcompanhamento}>
                  {savingModalAcompanhamento ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação arquivar/excluir acompanhamento */}
      <AlertDialog open={!!dialogAcompanhamentoAcao} onOpenChange={(open) => { if (!open) { setDialogAcompanhamentoAcao(null); setAcompanhamentoAcaoId(null); setAcompanhamentoAcaoNome(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAcompanhamentoAcao === 'arquivar' ? 'Arquivar acompanhamento' : 'Excluir acompanhamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAcompanhamentoAcao === 'arquivar'
                ? `Tem certeza que deseja arquivar o acompanhamento de "${acompanhamentoAcaoNome}"? Ele sairá da listagem e poderá ser recuperado depois (exibindo arquivados).`
                : `Tem certeza que deseja excluir permanentemente o acompanhamento de "${acompanhamentoAcaoNome}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDialogAcompanhamentoAcao(null); setAcompanhamentoAcaoId(null); setAcompanhamentoAcaoNome(''); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarAcaoAcompanhamento}
              className={dialogAcompanhamentoAcao === 'excluir' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {dialogAcompanhamentoAcao === 'arquivar' ? 'Arquivar' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pessoa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setPessoaParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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

export default GestaoPessoas;
