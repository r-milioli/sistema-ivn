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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, List, Search, BarChart3, Paperclip, X, ChevronLeft, ChevronRight, Eye, Plus, Calendar, TrendingUp, MapPin } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useTabsPermissoes } from '../../hooks/useTabsPermissoes';
import api, { API_ORIGIN } from '../../services/api';
import './Kids.css';

function fullPhotoUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

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

  const [loading, setLoading] = useState(false);
  const [previewCrianca, setPreviewCrianca] = useState(null);
  const [previewResponsavel, setPreviewResponsavel] = useState(null);
  const [activeTab, setActiveTab] = useState(tabsVisiveis[0]?.value || 'cadastro-kids');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      recepcionadoPor: user?.nome || '',
      diaVisita: getCurrentDateTime()
    }));
  }, [user]);

  useEffect(() => {
    if (!loadingTabs && tabsVisiveis.length > 0 && !tabsVisiveis.some(t => t.value === activeTab)) {
      setActiveTab(tabsVisiveis[0].value);
    }
  }, [loadingTabs, tabsVisiveis, activeTab]);

  // Preencher formulário da tab Cadastro com dados de um kid (retorno) e ir para a tab
  const preencherCadastroComKid = (kid) => {
    if (previewCrianca && previewCrianca.startsWith('blob:')) URL.revokeObjectURL(previewCrianca);
    if (previewResponsavel && previewResponsavel.startsWith('blob:')) URL.revokeObjectURL(previewResponsavel);
    // Mostrar as fotos do kid como preview (URLs); arquivos não são enviados a menos que o usuário escolha novos
    setPreviewCrianca(kid.fotoCrianca ? fullPhotoUrl(kid.fotoCrianca) : null);
    setPreviewResponsavel(kid.fotoResponsavel ? fullPhotoUrl(kid.fotoResponsavel) : null);
    const dataNasc = kid.dataNascimentoCrianca
      ? (kid.dataNascimentoCrianca.includes('T')
          ? kid.dataNascimentoCrianca.slice(0, 10)
          : kid.dataNascimentoCrianca)
      : '';
    setFormData({
      recepcionadoPor: user?.nome || '',
      diaVisita: getCurrentDateTime(),
      fotoCrianca: null,
      fotoCriancaNome: kid.fotoCrianca ? '(foto anterior exibida – envie nova para alterar)' : '',
      nomeCrianca: kid.nomeCrianca || '',
      dataNascimentoCrianca: dataNasc,
      fotoResponsavel: null,
      fotoResponsavelNome: kid.fotoResponsavel ? '(foto anterior exibida – envie nova para alterar)' : '',
      nomeResponsavel: kid.nomeResponsavel || '',
      whatsappResponsavel: kid.whatsappResponsavel || '',
      bairro: kid.bairro || '',
      cidade: kid.cidade || ''
    });
    const inputCrianca = document.getElementById('fotoCrianca');
    const inputResp = document.getElementById('fotoResponsavel');
    if (inputCrianca) inputCrianca.value = '';
    if (inputResp) inputResp.value = '';
    setActiveTab('cadastro-kids');
    toast({
      title: 'Formulário preenchido',
      description: 'Dados e fotos do kid carregados. Envie novas fotos se quiser alterar e cadastre a visita.',
      variant: 'default'
    });
  };

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
      if (previewCrianca?.startsWith('blob:')) URL.revokeObjectURL(previewCrianca);
      if (previewResponsavel?.startsWith('blob:')) URL.revokeObjectURL(previewResponsavel);
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

      const response = await api.post('/kids/cadastro', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const isFrequencia = response.data?.message && String(response.data.message).toLowerCase().includes('frequência');
      toast({
        title: 'Sucesso!',
        description: isFrequencia ? (response.data.message || 'Frequência adicionada para o dia.') : 'Criança cadastrada com sucesso!',
        variant: 'success'
      });

      if (previewCrianca?.startsWith('blob:')) URL.revokeObjectURL(previewCrianca);
      if (previewResponsavel?.startsWith('blob:')) URL.revokeObjectURL(previewResponsavel);
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="kids-tabs">
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
                                if (previewCrianca?.startsWith('blob:')) URL.revokeObjectURL(previewCrianca);
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
                                if (previewResponsavel?.startsWith('blob:')) URL.revokeObjectURL(previewResponsavel);
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
                  <BuscarKids onPreencherCadastro={preencherCadastroComKid} />
                </div>
              </TabsContent>
            )}

            {tabsVisiveis.some(t => t.value === 'estatisticas') && (
              <TabsContent value="estatisticas" className="kids-tabs-content">
                <div className="tab-content-wrapper">
                  <h2>Estatísticas Kids</h2>
                  <EstatisticasKids />
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

function formatDateKids(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnlyKids(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Buscar Kids: pesquisa, resultados em cards, botão Add para preencher cadastro (retorno)
const BuscarKids = ({ onPreencherCadastro }) => {
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [buscaDigitada, setBuscaDigitada] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePesquisar = async () => {
    const termo = buscaDigitada.trim();
    if (!termo) {
      toast({
        title: 'Campo vazio',
        description: 'Digite nome da criança, responsável, bairro ou cidade para buscar.',
        variant: 'destructive'
      });
      return;
    }
    setBusca(termo);
    setLoading(true);
    try {
      const response = await api.get('/kids', {
        params: { busca: termo, limit: 50, page: 1 }
      });
      setResults(response.data.kids || []);
      if ((response.data.kids || []).length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: 'Nenhum kid encontrado com esse critério.',
          variant: 'default'
        });
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar. Tente novamente.',
        variant: 'destructive'
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buscar-kids-container">
      <div className="buscar-kids-filters">
        <div className="buscar-kids-search-row">
          <div className="buscar-kids-search-wrap">
            <Search className="buscar-kids-search-icon" />
            <Input
              type="text"
              placeholder="Nome da criança, responsável, bairro ou cidade..."
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePesquisar())}
              className="form-input buscar-kids-input"
            />
          </div>
          <Button type="button" onClick={handlePesquisar} disabled={loading} className="buscar-kids-btn-pesquisar">
            {loading ? 'Buscando...' : 'Pesquisar'}
          </Button>
        </div>
      </div>

      {busca && (
        <div className="buscar-kids-results">
          {loading ? (
            <div className="buscar-kids-loading">Carregando...</div>
          ) : (
            <>
              <p className="buscar-kids-results-info">
                {results.length} {results.length === 1 ? 'registro encontrado' : 'registros encontrados'}
              </p>
              <div className="buscar-kids-cards">
                {results.map((kid) => (
                  <div key={kid.id} className="buscar-kids-card">
                    <div className="buscar-kids-card-fotos">
                      {kid.fotoCrianca ? (
                        <img src={fullPhotoUrl(kid.fotoCrianca)} alt="" className="buscar-kids-card-foto" />
                      ) : (
                        <div className="buscar-kids-card-foto-placeholder">Foto criança</div>
                      )}
                      {kid.fotoResponsavel ? (
                        <img src={fullPhotoUrl(kid.fotoResponsavel)} alt="" className="buscar-kids-card-foto" />
                      ) : (
                        <div className="buscar-kids-card-foto-placeholder">Foto resp.</div>
                      )}
                    </div>
                    <div className="buscar-kids-card-body">
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Recepcionado por:</span>
                        <span>{kid.recepcionadoPor || '-'}</span>
                      </div>
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Data visita:</span>
                        <span>{formatDateKids(kid.dataVisita)}</span>
                      </div>
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Nome do Kids:</span>
                        <span>{kid.nomeCrianca || '-'}</span>
                      </div>
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Data nasc.:</span>
                        <span>{formatDateOnlyKids(kid.dataNascimentoCrianca)}</span>
                      </div>
                      {kid.idadeAtual && (
                        <div className="buscar-kids-card-row">
                          <span className="buscar-kids-card-label">Idade:</span>
                          <span>{kid.idadeAtual}</span>
                        </div>
                      )}
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Nome responsável:</span>
                        <span>{kid.nomeResponsavel || '-'}</span>
                      </div>
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">WhatsApp:</span>
                        <span>{kid.whatsappResponsavel || '-'}</span>
                      </div>
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Bairro:</span>
                        <span>{kid.bairro || '-'}</span>
                      </div>
                      <div className="buscar-kids-card-row">
                        <span className="buscar-kids-card-label">Cidade:</span>
                        <span>{kid.cidade || '-'}</span>
                      </div>
                    </div>
                    <div className="buscar-kids-card-actions">
                      <Button
                        type="button"
                        onClick={() => onPreencherCadastro(kid)}
                        className="buscar-kids-btn-add"
                        title="Usar dados para novo cadastro (retorno)"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!busca && (
        <p className="buscar-kids-hint">Digite no campo acima e clique em Pesquisar para buscar kids.</p>
      )}
    </div>
  );
};

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

// Estatísticas Kids (semelhante à tab Estatísticas da Recepção)
const EstatisticasKids = () => {
  const { toast } = useToast();
  const [estatisticas, setEstatisticas] = useState({
    porDia: [],
    porMes: [],
    porAno: [],
    porBairro: [],
    porDiaSemana: [],
    resumo: { hoje: 0, mesAtual: 0, anoAtual: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarEstatisticas = async () => {
      setLoading(true);
      try {
        const response = await api.get('/kids/estatisticas');
        setEstatisticas(response.data);
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar estatísticas. Tente novamente.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    buscarEstatisticas();
  }, [toast]);

  if (loading) {
    return <div className="estatisticas-loading">Carregando estatísticas...</div>;
  }

  return (
    <div className="estatisticas-container">
      <div className="estatisticas-summary">
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Hoje</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porDia[estatisticas.porDia.length - 1]?.quantidade ?? estatisticas.resumo.hoje ?? 0}</div>
            <div className="stat-label">Kids</div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Este Mês</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porMes.reduce((sum, m) => sum + m.quantidade, 0)}</div>
            <div className="stat-label">Kids</div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Este Ano</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.porAno[estatisticas.porAno.length - 1]?.quantidade ?? estatisticas.resumo.anoAtual ?? 0}</div>
            <div className="stat-label">Kids</div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardTitle className="stat-card-title">Total</CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <div className="stat-value">{estatisticas.resumo.total ?? estatisticas.porAno.reduce((sum, a) => sum + a.quantidade, 0)}</div>
            <div className="stat-label">Kids</div>
          </CardContent>
        </Card>
      </div>

      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <Calendar className="stat-icon" />
            Kids por Dia (Últimos 7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {(estatisticas.porDia.length ? estatisticas.porDia : []).map((item, index) => {
                const maxValue = Math.max(...estatisticas.porDia.map(d => d.quantidade), 1);
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div className="bar" style={{ height: `${height}%` }} title={`${item.quantidade} kids`} />
                    </div>
                    <div className="bar-label">{item.data}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <TrendingUp className="stat-icon" />
            Kids por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {(estatisticas.porMes.length ? estatisticas.porMes : []).map((item, index) => {
                const maxValue = Math.max(...estatisticas.porMes.map(m => m.quantidade), 1);
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div className="bar" style={{ height: `${height}%` }} title={`${item.quantidade} kids`} />
                    </div>
                    <div className="bar-label">{item.mes}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <BarChart3 className="stat-icon" />
            Kids por Ano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {(estatisticas.porAno.length ? estatisticas.porAno : []).map((item, index) => {
                const maxValue = Math.max(...estatisticas.porAno.map(a => a.quantidade), 1);
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div className="bar" style={{ height: `${height}%` }} title={`${item.quantidade} kids`} />
                    </div>
                    <div className="bar-label">{item.ano}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <MapPin className="stat-icon" />
            Kids por Bairro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="list-chart">
            {(estatisticas.porBairro.length ? estatisticas.porBairro : []).map((item, index) => {
              const maxValue = Math.max(...estatisticas.porBairro.map(b => b.quantidade), 1);
              const width = (item.quantidade / maxValue) * 100;
              return (
                <div key={index} className="list-chart-item">
                  <div className="list-chart-label">
                    <span>{item.bairro}</span>
                    <span className="list-chart-value">{item.quantidade} ({item.percentual}%)</span>
                  </div>
                  <div className="list-chart-bar-wrapper">
                    <div className="list-chart-bar" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="stat-chart-card">
        <CardHeader>
          <CardTitle className="stat-chart-title">
            <Calendar className="stat-icon" />
            Kids por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="bar-chart">
              {(estatisticas.porDiaSemana.length ? estatisticas.porDiaSemana : []).map((item, index) => {
                const maxValue = Math.max(...estatisticas.porDiaSemana.map(d => d.quantidade), 1);
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div className="bar" style={{ height: `${height}%` }} title={`${item.quantidade} kids`} />
                    </div>
                    <div className="bar-label">{item.dia}</div>
                    <div className="bar-value">{item.quantidade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Kids;
