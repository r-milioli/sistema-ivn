import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import BackToDashboard from '../../components/BackToDashboard/BackToDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { FileText, UserCheck, Download, Edit } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';
import './Relatorio.css';

const Relatorio = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <BackToDashboard />
          <h1>Relatórios</h1>
          
          <Tabs defaultValue="relatorios" className="relatorio-tabs">
            <TabsList className="relatorio-tabs-list">
              <TabsTrigger value="relatorios" className="relatorio-tabs-trigger">
                <FileText className="tab-icon" />
                <span>Relatórios</span>
              </TabsTrigger>
              <TabsTrigger value="atribuido-mim" className="relatorio-tabs-trigger">
                <UserCheck className="tab-icon" />
                <span>Atribuído a Mim</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="relatorios" className="relatorio-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Relatórios</h2>
                <RelatorioFormWrapper />
              </div>
            </TabsContent>

            <TabsContent value="atribuido-mim" className="relatorio-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Atribuído a Mim</h2>
                <RelatoriosAtribuidosMim />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
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
    nomeMinisterio: '',
    mesReferencia: mesAtual,
    conteudo: '',
    pastorLiderId: ''
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [pastoresLideres, setPastoresLideres] = useState([]);
  const [ministeriosLider, setMinisteriosLider] = useState([]);

  // Carregar pastores líderes
  useEffect(() => {
    const carregarPastoresLideres = async () => {
      try {
        const response = await api.get('/relatorios/pastores-lideres');
        setPastoresLideres(response.data.pastoresLideres || []);
      } catch (error) {
        console.error('Erro ao carregar pastores líderes:', error);
        toast({
          title: 'Aviso',
          description: 'Erro ao carregar lista de pastores líderes.',
          variant: 'destructive',
        });
      }
    };
    carregarPastoresLideres();
  }, [toast]);

  // Carregar ministérios onde o usuário é líder
  useEffect(() => {
    const carregarMinisteriosLider = async () => {
      try {
        const response = await api.get('/ministerios/meus-lider');
        setMinisteriosLider(response.data.ministerios || []);
      } catch (error) {
        console.error('Erro ao carregar ministérios como líder:', error);
        toast({
          title: 'Aviso',
          description: 'Erro ao carregar lista de ministérios.',
          variant: 'destructive',
        });
      }
    };
    carregarMinisteriosLider();
  }, [toast]);

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
            nomeMinisterio: relatorio.nomeMinisterio || '',
            mesReferencia: mesValue,
            conteudo: relatorio.conteudo,
            pastorLiderId: relatorio.pastorLiderId || ''
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
        nomeMinisterio: '',
        mesReferencia: mesAtual,
        conteudo: '',
        pastorLiderId: ''
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
          nomeMinisterio: '',
          mesReferencia: mesAtual,
          conteudo: '',
          pastorLiderId: ''
        });
        onSaveSuccess();
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
    'link', 'image', 'video'
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
          <select
            id="nomeMinisterio"
            name="nomeMinisterio"
            value={formData.nomeMinisterio}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Selecione um ministério </option>
            {ministeriosLider.map((ministerio) => (
              <option key={ministerio.id} value={ministerio.nome}>
                {ministerio.nome}
              </option>
            ))}
          </select>
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

      <div className="form-row form-row-2">
        <div className="form-group">
          <Label htmlFor="pastorLiderId">Pastor Líder do Ministério</Label>
          <select
            id="pastorLiderId"
            name="pastorLiderId"
            value={formData.pastorLiderId}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Selecione um pastor líder</option>
            {pastoresLideres.map((pastor) => (
              <option key={pastor.id} value={pastor.id}>
                {pastor.nomeCompleto}
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
        const response = await api.get('/relatorios');
        setRelatorios(response.data.relatorios || []);
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
      link.setAttribute('download', `Relatorio_${relatorio.nomeMinisterio || 'Sem_Ministerio'}_${relatorio.mesReferencia}_${relatorio.anoReferencia}.html`);
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
                    <h4 className="relatorio-item-nome">{relatorio.nomeMinisterio || 'Sem Ministério'}</h4>
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

// Componente de Relatórios Atribuídos a Mim
const RelatoriosAtribuidosMim = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarRelatorios = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/relatorios', {
          params: {
            pastorLiderId: user.id
          }
        });
        setRelatorios(response.data.relatorios || []);
      } catch (error) {
        console.error('Erro ao carregar relatórios atribuídos:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar relatórios atribuídos. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    buscarRelatorios();
  }, [user, toast]);

  const handleDownload = async (relatorio) => {
    try {
      const response = await api.get(`/relatorios/${relatorio.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_${relatorio.nomeMinisterio || 'Sem_Ministerio'}_${relatorio.mesReferencia}_${relatorio.anoReferencia}.html`);
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
      {loading ? (
        <div className="text-center p-8">Carregando relatórios...</div>
      ) : relatorios.length === 0 ? (
        <div className="relatorios-empty">
          <p>Nenhum relatório atribuído a você ainda.</p>
        </div>
      ) : (
        <div className="relatorios-list">
          {relatorios.map((relatorio) => (
            <Card key={relatorio.id} className="relatorio-item">
              <CardContent className="relatorio-item-content">
                <div className="relatorio-item-info">
                  <div className="relatorio-item-header">
                    <h4 className="relatorio-item-nome">{relatorio.nomeMinisterio || 'Sem Ministério'}</h4>
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

export default Relatorio;
