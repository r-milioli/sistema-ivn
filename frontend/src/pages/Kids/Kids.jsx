import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import BackToDashboard from '../../components/BackToDashboard/BackToDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, List, Search, BarChart3, Paperclip, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useTabsPermissoes } from '../../hooks/useTabsPermissoes';
import api from '../../services/api';
import './Kids.css';

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function idadeFromDataNascimento(dataStr) {
  if (!dataStr) return '';
  const nasc = new Date(dataStr);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (hoje.getDate() < nasc.getDate()) meses--;
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (anos === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}${meses > 0 ? ` e ${meses} ${meses === 1 ? 'mês' : 'meses'}` : ''}`;
}

const Kids = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const tabsPadrao = [
    { value: 'cadastro-kids', label: 'Cadastro Kids', icon: UserPlus },
    { value: 'listar-kids', label: 'Listar Kids', icon: List },
    { value: 'buscar-kids', label: 'Buscar Kids', icon: Search },
    { value: 'estatisticas', label: 'Estatísticas', icon: BarChart3 }
  ];

  const { tabsVisiveis, loading: loadingTabs } = useTabsPermissoes(tabsPadrao);

  const [formData, setFormData] = useState({
    recepcionadoPor: user?.nome || '',
    diaVisita: getCurrentDateTime(),
    fotoCrianca: null,
    fotoCriancaNome: '',
    nomeCrianca: '',
    dataNascimentoCrianca: '',
    fotoResponsavel: null,
    fotoResponsavelNome: '',
    nomeResponsavel: '',
    whatsappResponsavel: '',
    bairro: '',
    cidade: ''
  });

  const idadeAtual = useMemo(
    () => idadeFromDataNascimento(formData.dataNascimentoCrianca),
    [formData.dataNascimentoCrianca]
  );

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      recepcionadoPor: user?.nome || '',
      diaVisita: getCurrentDateTime()
    }));
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [previewCrianca, setPreviewCrianca] = useState(null);
  const [previewResponsavel, setPreviewResponsavel] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoCrianca' && files?.length) {
      const file = files[0];
      if (previewCrianca) URL.revokeObjectURL(previewCrianca);
      setPreviewCrianca(file ? URL.createObjectURL(file) : null);
      setFormData(prev => ({
        ...prev,
        fotoCrianca: file,
        fotoCriancaNome: file.name
      }));
    } else if (name === 'fotoResponsavel' && files?.length) {
      const file = files[0];
      if (previewResponsavel) URL.revokeObjectURL(previewResponsavel);
      setPreviewResponsavel(file ? URL.createObjectURL(file) : null);
      setFormData(prev => ({
        ...prev,
        fotoResponsavel: file,
        fotoResponsavelNome: file.name
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    return () => {
      if (previewCrianca) URL.revokeObjectURL(previewCrianca);
      if (previewResponsavel) URL.revokeObjectURL(previewResponsavel);
    };
  }, [previewCrianca, previewResponsavel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('diaVisita', formData.diaVisita);
      fd.append('nomeCrianca', formData.nomeCrianca);
      fd.append('dataNascimentoCrianca', formData.dataNascimentoCrianca);
      fd.append('nomeResponsavel', formData.nomeResponsavel);
      fd.append('whatsappResponsavel', formData.whatsappResponsavel);
      fd.append('bairro', formData.bairro);
      fd.append('cidade', formData.cidade);
      if (formData.fotoCrianca) fd.append('fotoCrianca', formData.fotoCrianca);
      if (formData.fotoResponsavel) fd.append('fotoResponsavel', formData.fotoResponsavel);

      await api.post('/kids/cadastro', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast({
        title: 'Sucesso!',
        description: 'Criança cadastrada com sucesso!',
        variant: 'success'
      });

      if (previewCrianca) URL.revokeObjectURL(previewCrianca);
      if (previewResponsavel) URL.revokeObjectURL(previewResponsavel);
      setPreviewCrianca(null);
      setPreviewResponsavel(null);
      setFormData({
        recepcionadoPor: user?.nome || '',
        diaVisita: getCurrentDateTime(),
        fotoCrianca: null,
        fotoCriancaNome: '',
        nomeCrianca: '',
        dataNascimentoCrianca: '',
        fotoResponsavel: null,
        fotoResponsavelNome: '',
        nomeResponsavel: '',
        whatsappResponsavel: '',
        bairro: '',
        cidade: ''
      });
      const inputCrianca = document.getElementById('fotoCrianca');
      const inputResp = document.getElementById('fotoResponsavel');
      if (inputCrianca) inputCrianca.value = '';
      if (inputResp) inputResp.value = '';
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao cadastrar. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loadingTabs && tabsVisiveis.length === 0) {
    return (
      <MainLayout>
        <main className="dashboard-main">
          <div className="dashboard-content">
            <BackToDashboard />
            <h1>Kids</h1>
            <div className="tab-content-wrapper" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              <p>Você não tem permissão para acessar as abas desta página.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Entre em contato com o administrador se acredita que deveria ter acesso.</p>
            </div>
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <BackToDashboard />
          <h1>Kids</h1>

          <Tabs defaultValue={tabsVisiveis[0]?.value || 'cadastro-kids'} className="kids-tabs">
            <TabsList className="kids-tabs-list">
              {tabsVisiveis.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="kids-tabs-trigger">
                    {IconComponent && <IconComponent className="tab-icon" />}
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabsVisiveis.some(t => t.value === 'cadastro-kids') && (
              <TabsContent value="cadastro-kids" className="kids-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Cadastro Kids</h2>
                  <form onSubmit={handleSubmit} className="kids-form">
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
                        <Label htmlFor="fotoCrianca">Foto da criança</Label>
                        <div className="file-upload-wrapper">
                          <div className="file-input-wrap">
                            <div className="file-input-visual">
                              {formData.fotoCriancaNome ? (
                                <>
                                  <Paperclip className="file-icon" />
                                  <span className="file-input-visual-text">{formData.fotoCriancaNome}</span>
                                </>
                              ) : (
                                <span className="file-input-placeholder">Escolher arquivo</span>
                              )}
                            </div>
                            <Input
                              type="file"
                              id="fotoCrianca"
                              name="fotoCrianca"
                              onChange={handleChange}
                              accept="image/jpeg,image/jpg,image/png"
                              className="file-input-hidden"
                            />
                          </div>
                          {formData.fotoCriancaNome && (
                            <button
                              type="button"
                              onClick={() => {
                                if (previewCrianca) URL.revokeObjectURL(previewCrianca);
                                setPreviewCrianca(null);
                                setFormData(prev => ({ ...prev, fotoCrianca: null, fotoCriancaNome: '' }));
                                const el = document.getElementById('fotoCrianca');
                                if (el) el.value = '';
                              }}
                              className="remove-file-button-inline"
                              aria-label="Remover arquivo"
                            >
                              <X className="remove-icon" size={16} />
                            </button>
                          )}
                        </div>
                        {previewCrianca && (
                          <div className="file-preview-wrap">
                            <img src={previewCrianca} alt="Preview foto da criança" className="file-preview-img" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="nomeCrianca">Nome completo da criança</Label>
                        <Input
                          type="text"
                          id="nomeCrianca"
                          name="nomeCrianca"
                          value={formData.nomeCrianca}
                          onChange={handleChange}
                          placeholder="Nome completo"
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="dataNascimentoCrianca">Data de nascimento</Label>
                        <Input
                          type="date"
                          id="dataNascimentoCrianca"
                          name="dataNascimentoCrianca"
                          value={formData.dataNascimentoCrianca}
                          onChange={handleChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="idadeAtual">Idade atual</Label>
                        <Input
                          type="text"
                          id="idadeAtual"
                          value={idadeAtual}
                          readOnly
                          className="form-input form-input-readonly"
                          placeholder="Preencha a data de nascimento"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <Label htmlFor="fotoResponsavel">Foto responsável</Label>
                        <div className="file-upload-wrapper">
                          <div className="file-input-wrap">
                            <div className="file-input-visual">
                              {formData.fotoResponsavelNome ? (
                                <>
                                  <Paperclip className="file-icon" />
                                  <span className="file-input-visual-text">{formData.fotoResponsavelNome}</span>
                                </>
                              ) : (
                                <span className="file-input-placeholder">Escolher arquivo</span>
                              )}
                            </div>
                            <Input
                              type="file"
                              id="fotoResponsavel"
                              name="fotoResponsavel"
                              onChange={handleChange}
                              accept="image/jpeg,image/jpg,image/png"
                              className="file-input-hidden"
                            />
                          </div>
                          {formData.fotoResponsavelNome && (
                            <button
                              type="button"
                              onClick={() => {
                                if (previewResponsavel) URL.revokeObjectURL(previewResponsavel);
                                setPreviewResponsavel(null);
                                setFormData(prev => ({ ...prev, fotoResponsavel: null, fotoResponsavelNome: '' }));
                                const el = document.getElementById('fotoResponsavel');
                                if (el) el.value = '';
                              }}
                              className="remove-file-button-inline"
                              aria-label="Remover arquivo"
                            >
                              <X className="remove-icon" size={16} />
                            </button>
                          )}
                        </div>
                        {previewResponsavel && (
                          <div className="file-preview-wrap">
                            <img src={previewResponsavel} alt="Preview foto do responsável" className="file-preview-img" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <Label htmlFor="nomeResponsavel">Nome do responsável</Label>
                        <Input
                          type="text"
                          id="nomeResponsavel"
                          name="nomeResponsavel"
                          value={formData.nomeResponsavel}
                          onChange={handleChange}
                          placeholder="Nome do responsável"
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <Label htmlFor="whatsappResponsavel">WhatsApp responsável</Label>
                        <Input
                          type="tel"
                          id="whatsappResponsavel"
                          name="whatsappResponsavel"
                          value={formData.whatsappResponsavel}
                          onChange={handleChange}
                          placeholder="(00) 00000-0000"
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
                          placeholder="Bairro"
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
                          placeholder="Cidade"
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <Button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
            )}

            {tabsVisiveis.some(t => t.value === 'listar-kids') && (
              <TabsContent value="listar-kids" className="kids-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Listar Kids</h2>
                  <KidsTable />
                </div>
              </TabsContent>
            )}

            {tabsVisiveis.some(t => t.value === 'buscar-kids') && (
              <TabsContent value="buscar-kids" className="kids-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Buscar Kids</h2>
                  <p className="tab-placeholder">Em breve. Aqui você poderá buscar crianças cadastradas.</p>
                </div>
              </TabsContent>
            )}

            {tabsVisiveis.some(t => t.value === 'estatisticas') && (
              <TabsContent value="estatisticas" className="kids-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Estatísticas</h2>
                  <p className="tab-placeholder">Em breve. Estatísticas do ministério Kids.</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

// Data atual no formato YYYY-MM-DD para o filtro
function getKidsListCurrentDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Tabela Listar Kids (semelhante à Listar Visitantes da Recepção)
const KidsTable = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dataVisita, setDataVisita] = useState(() => getKidsListCurrentDate());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchKids = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: pageSize,
        };
        if (search.trim()) params.busca = search.trim();
        if (dataVisita) params.dataVisita = dataVisita;
        const response = await api.get('/kids', { params });
        setKids(response.data.kids || []);
        setPagination({
          total: response.data.total ?? 0,
          totalPages: response.data.totalPages ?? 0,
        });
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar kids. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchKids();
  }, [currentPage, pageSize, search, dataVisita, toast]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleDataVisitaChange = (value) => {
    setDataVisita(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + kids.length;

  return (
    <div className="kids-list-table-container">
      <div className="kids-filters-section">
        <div className="kids-filters-row">
          <div className="kids-filter-group">
            <Label htmlFor="kids-search">Buscar</Label>
            <div className="kids-search-input-wrapper">
              <Search className="kids-search-icon" />
              <Input
                type="text"
                id="kids-search"
                placeholder="Nome da criança, responsável, bairro ou cidade..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="form-input kids-search-input"
              />
            </div>
          </div>
          <div className="kids-filter-group">
            <Label htmlFor="kids-dataVisita">Data da visita</Label>
            <Input
              type="date"
              id="kids-dataVisita"
              value={dataVisita}
              onChange={(e) => handleDataVisitaChange(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="kids-table-wrapper">
        {loading ? (
          <div className="kids-table-loading">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recepcionado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Nome do Kids</TableHead>
                <TableHead>Nome responsável</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                kids.map((kid) => (
                  <TableRow key={kid.id}>
                    <TableCell>{kid.recepcionadoPor || '-'}</TableCell>
                    <TableCell>{formatDate(kid.dataVisita)}</TableCell>
                    <TableCell>{kid.nomeCrianca || '-'}</TableCell>
                    <TableCell>{kid.nomeResponsavel || '-'}</TableCell>
                    <TableCell>{kid.whatsappResponsavel || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="kids-action-btn"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="kids-pagination-section">
        <div className="kids-pagination-info">
          <span>
            Mostrando {kids.length > 0 ? startIndex + 1 : 0} a {endIndex} de {pagination.total} registros
          </span>
          <div className="kids-page-size-selector">
            <Label htmlFor="kids-pageSize">Linhas por página:</Label>
            <select
              id="kids-pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="form-select kids-page-size-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="kids-pagination-controls">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="kids-pagination-button"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="kids-page-numbers">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="kids-pagination-button kids-page-number"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage === pagination.totalPages || loading}
            className="kids-pagination-button"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Kids;
