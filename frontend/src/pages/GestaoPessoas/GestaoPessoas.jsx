import React, { useState, useMemo, useEffect } from 'react';
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

  // Carregar dados iniciais
  useEffect(() => {
    loadMinisterios();
  }, []);

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
      toast({ title: 'CEP encontrado', description: 'Endereço preenchido automaticamente.' });
    } else {
      toast({ title: 'CEP não encontrado', description: 'Verifique o número e tente novamente.', variant: 'destructive' });
    }
  };

  const handleCepBlurEdit = async (cep) => {
    const endereco = await fetchViaCep(cep);
    if (endereco) {
      setEditFormData(prev => ({ ...prev, ...endereco }));
      toast({ title: 'CEP encontrado', description: 'Endereço preenchido automaticamente.' });
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
      setAtribuicaoFormData({
        cargoEclesiastico: atribuicao.cargoEclesiastico || '',
        estagiosUsuario: atribuicao.estagiosUsuario || [],
        ministeriosLider: atribuicao.ministeriosLider?.map(m => m.id) || [],
        ministeriosParticipante: atribuicao.ministeriosParticipante?.map(m => m.id) || [],
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

    if (atribuicaoFormData.estagiosUsuario.includes('Líder') && atribuicaoFormData.ministeriosLider.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione pelo menos um ministério para líder.',
        variant: 'destructive',
      });
      setLoadingAtribuicao(false);
      return;
    }

    if (atribuicaoFormData.estagiosUsuario.includes('Participante de Ministério') && atribuicaoFormData.ministeriosParticipante.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione pelo menos um ministério para participante.',
        variant: 'destructive',
      });
      setLoadingAtribuicao(false);
      return;
    }

    try {
      await api.post(`/pessoas/${selectedPersonAtribuicao.id}/atribuicoes`, atribuicaoFormData);
      toast({
        title: 'Sucesso',
        description: 'Atribuições salvas com sucesso!',
      });
      setAtribuicaoFormData({
        cargoEclesiastico: '',
        estagiosUsuario: [],
        ministeriosLider: [],
        ministeriosParticipante: [],
        tipoUsuario: 'Usuario'
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
