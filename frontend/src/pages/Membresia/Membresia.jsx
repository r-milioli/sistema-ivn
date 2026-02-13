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
import { Search, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
import './Membresia.css';

const Membresia = () => {
  const { toast } = useToast();

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
        variant: 'success',
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
        variant: 'success',
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
          <BackToDashboard />
          <h1>Membresia</h1>
          
          <Tabs defaultValue="membresia" className="membresia-tabs">
            <TabsList className="membresia-tabs-list">
              <TabsTrigger value="membresia" className="membresia-tabs-trigger">
                <GraduationCap className="tab-icon" />
                <span>Membresia</span>
              </TabsTrigger>
              <TabsTrigger value="alunos-membresia" className="membresia-tabs-trigger">
                <Users className="tab-icon" />
                <span>Alunos Membresia</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="membresia" className="membresia-tabs-content">
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

            <TabsContent value="alunos-membresia" className="membresia-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Alunos Membresia</h2>
                <ListarMembros alunosMembresia={alunosMembresia} onReload={loadMatriculas} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

// Componente de Listagem de Membros
const ListarMembros = ({ alunosMembresia, onReload }) => {
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
        variant: 'success',
      });

      setTornarMembroDialogOpen(false);
      setAlunoParaTornarMembro(null);
      
      // Recarregar matrículas para atualizar o estágio
      if (onReload) {
        onReload();
      }
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
        variant: 'success',
      });

      setTornarMembroDialogOpen(false);
      setAlunoParaTornarMembro(null);
      
      // Recarregar matrículas para atualizar o estágio
      if (onReload) {
        onReload();
      }
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

export default Membresia;
