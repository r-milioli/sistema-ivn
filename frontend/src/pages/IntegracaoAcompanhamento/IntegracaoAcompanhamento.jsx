import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Home, UserCheck } from 'lucide-react';
import { useTabsPermissoes } from '../../hooks/useTabsPermissoes';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';
import './IntegracaoAcompanhamento.css';

const IntegracaoAcompanhamento = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inicio');

  const tabsPadrao = [
    { value: 'inicio', label: 'Início', icon: Home },
    { value: 'atribuicao-acompanhante', label: 'Atribuição de acompanhante', icon: UserCheck },
  ];

  const { tabsVisiveis, loading: loadingTabs } = useTabsPermissoes(tabsPadrao);

  // Dados da tab Atribuição de acompanhante
  const [novosConvertidos, setNovosConvertidos] = useState([]);
  const [participantesIntegracao, setParticipantesIntegracao] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [atualizandoAcompanhante, setAtualizandoAcompanhante] = useState(null);

  // Carregar ministerios e participantes do ministério Integração
  const [ministerios, setMinisterios] = useState([]);
  useEffect(() => {
    const carregarMinisterios = async () => {
      try {
        const res = await api.get('/ministerios', { params: { incluirInativos: true } });
        const list = res.data.ministerios || [];
        setMinisterios(list);
        console.log('[Dropdown acompanhante] Ministérios carregados:', list.length, list.map(m => ({ id: m.id, nome: m.nome })));
      } catch (e) {
        console.error('Erro ao carregar ministérios:', e);
      }
    };
    carregarMinisterios();
  }, []);

  const ministerioIntegracao = useMemo(() => {
    if (!ministerios.length) return null;
    // Remover todos os acentos (á→a, ã→a, etc.): NFD + remover caracteres de combinação (U+0300–036F)
    const nomeNorm = (n) => (n || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Preferir nome exato "integracao", senão qualquer um que contenha "integracao"
    const exact = ministerios.find(m => nomeNorm(m.nome) === 'integracao');
    if (exact) return exact;
    return ministerios.find(m => nomeNorm(m.nome).includes('integracao')) || null;
  }, [ministerios]);

  // Id do ministério Integração (backend pode retornar id ou ministerio_id)
  const ministerioIntegracaoId = ministerioIntegracao ? (ministerioIntegracao.id ?? ministerioIntegracao.ministerio_id) : null;

  useEffect(() => {
    if (!ministerioIntegracaoId) {
      console.log('[Dropdown acompanhante] Sem ministério Integração. ministerioIntegracao:', ministerioIntegracao, 'ministerios count:', ministerios.length);
      setParticipantesIntegracao([]);
      return;
    }
    const ministerioId = Number(ministerioIntegracaoId);
    if (Number.isNaN(ministerioId)) {
      console.warn('[Dropdown acompanhante] ministerioId inválido:', ministerioIntegracaoId);
      setParticipantesIntegracao([]);
      return;
    }
    console.log('[Dropdown acompanhante] Carregando participantes. ministerioIntegracao:', ministerioIntegracao, 'ministerioId enviado:', ministerioId);
    const carregar = async () => {
      try {
        const url = '/integracao/ministerios/pessoas';
        const params = { ministerioId };
        const res = await api.get(url, { params });
        console.log('[Dropdown acompanhante] Resposta da API:', {
          status: res.status,
          data: res.data,
          dataKeys: res.data ? Object.keys(res.data) : [],
          participacoes: res.data?.participacoes,
          participacoesLength: res.data?.participacoes?.length ?? 0,
          primeiroItem: res.data?.participacoes?.[0],
        });
        // Backend retorna { participacoes: [...] } com snake_case (pessoa_id, nome_completo, e_lider)
        const lista = res.data?.participacoes ?? res.data?.participantes ?? (Array.isArray(res.data) ? res.data : []);
        const listaFinal = Array.isArray(lista) ? lista : [];
        console.log('[Dropdown acompanhante] Lista final para o dropdown:', listaFinal.length, 'itens:', listaFinal);
        setParticipantesIntegracao(listaFinal);
      } catch (e) {
        console.error('[Dropdown acompanhante] Erro ao carregar participantes:', e);
        console.error('[Dropdown acompanhante] Resposta do erro:', e.response?.data, 'Status:', e.response?.status);
        setParticipantesIntegracao([]);
      }
    };
    carregar();
  }, [ministerioIntegracaoId, ministerios.length]);

  // Carregar novos convertidos quando abrir a tab
  useEffect(() => {
    if (activeTab !== 'atribuicao-acompanhante') return;
    const carregar = async () => {
      setLoadingLista(true);
      try {
        const res = await api.get('/integracao/novos-convertidos', {
          params: { page: 1, pageSize: 200 },
        });
        setNovosConvertidos(res.data.novosConvertidos || []);
      } catch (e) {
        console.error('Erro ao carregar novos convertidos:', e);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de novos convertidos.',
          variant: 'destructive',
        });
        setNovosConvertidos([]);
      } finally {
        setLoadingLista(false);
      }
    };
    carregar();
  }, [activeTab, toast]);

  const handleMudarAcompanhante = async (pessoaId, acompanhanteId) => {
    setAtualizandoAcompanhante(pessoaId);
    try {
      await api.put(`/integracao/conversoes/${pessoaId}/acompanhante`, {
        acompanhanteId: acompanhanteId === '' || acompanhanteId == null ? null : Number(acompanhanteId),
      });
      setNovosConvertidos(prev =>
        prev.map(p =>
          p.id === pessoaId
            ? {
                ...p,
                acompanhadoPorId: acompanhanteId === '' || acompanhanteId == null ? null : Number(acompanhanteId),
                acompanhadoPor:
                  acompanhanteId === '' || acompanhanteId == null
                    ? null
                    : (() => {
                        const part = participantesIntegracao.find(p => (p.pessoa_id ?? p.pessoaId) === Number(acompanhanteId));
                        return part ? (part.nome_completo ?? part.nomeCompleto ?? '') : '';
                      })(),
              }
            : p
        )
      );
      toast({ title: 'Sucesso', description: 'Acompanhante atualizado.' });
    } catch (e) {
      toast({
        title: 'Erro',
        description: e.response?.data?.message || 'Erro ao atualizar acompanhante.',
        variant: 'destructive',
      });
    } finally {
      setAtualizandoAcompanhante(null);
    }
  };

  if (!loadingTabs && tabsVisiveis.length === 0) {
    return (
      <MainLayout>
        <main className="dashboard-main">
          <div className="dashboard-content integracao-acompanhamento-content">
            <h1>Integração acompanhamento</h1>
            <p className="no-permission-message">Você não tem permissão para acessar as abas desta página.</p>
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content integracao-acompanhamento-content">
          <h1>Integração acompanhamento</h1>
          <p className="page-description">
            Acompanhamento do processo de integração de visitantes e novos convertidos.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="integracao-acompanhamento-tabs">
            <TabsList className="integracao-acompanhamento-tabs-list">
              {tabsVisiveis.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="integracao-acompanhamento-tabs-trigger"
                  >
                    {Icon && <Icon className="tab-icon" />}
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="inicio" className="integracao-acompanhamento-tabs-content">
              <div className="tab-content-wrapper">
                <p>Selecione a aba &quot;Atribuição de acompanhante&quot; para gerenciar os novos convertidos e seus acompanhantes.</p>
              </div>
            </TabsContent>

            <TabsContent value="atribuicao-acompanhante" className="integracao-acompanhamento-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Atribuição de acompanhante</h2>
                <p className="section-description">
                  Novos convertidos e atribuição ao participante do ministério de Integração que fará o acompanhamento.
                </p>

                {!ministerioIntegracao && (
                  <p className="aviso-ministerio">
                    Crie ou cadastre um ministério com o nome &quot;Integração&quot; (em Config do sistema → Ministérios) para listar os acompanhantes no dropdown.
                  </p>
                )}
                {ministerioIntegracao && participantesIntegracao.length === 0 && (
                  <p className="aviso-ministerio">
                    Nenhum participante no ministério Integração. Adicione pessoas em <strong>Gestão de Pessoas → Atribuição</strong> (Ministérios como Líder ou Ministérios como Participante → selecione &quot;Integração&quot; e salve).
                  </p>
                )}

                {loadingLista ? (
                  <p>Carregando lista de novos convertidos...</p>
                ) : (
                  <div className="table-wrapper">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Sobrenome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Aceita entrar no grupo</TableHead>
                          <TableHead>Acompanhante</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {novosConvertidos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              Nenhum novo convertido encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          novosConvertidos.map(pessoa => (
                            <TableRow key={pessoa.id}>
                              <TableCell className="font-medium">{pessoa.nome}</TableCell>
                              <TableCell>{pessoa.sobrenome || '-'}</TableCell>
                              <TableCell>{pessoa.telefone || pessoa.whatsapp || '-'}</TableCell>
                              <TableCell>
                                {pessoa.podeIncluirGrupoWhatsapp === true
                                  ? 'Sim'
                                  : pessoa.podeIncluirGrupoWhatsapp === false
                                    ? 'Não'
                                    : '-'}
                              </TableCell>
                              <TableCell>
                                <select
                                  className="form-select select-acompanhante"
                                  value={pessoa.acompanhadoPorId ?? ''}
                                  onChange={e => handleMudarAcompanhante(pessoa.id, e.target.value)}
                                  disabled={atualizandoAcompanhante === pessoa.id}
                                >
                                  <option value="">Selecione...</option>
                                  {participantesIntegracao.map(part => {
                                    const id = part.pessoa_id ?? part.pessoaId;
                                    const nome = (part.nome_completo ?? part.nomeCompleto ?? '').trim() || 'Sem nome';
                                    const eLider = part.e_lider ?? part.eLider;
                                    return (
                                      <option key={id} value={id}>
                                        {nome}
                                        {eLider ? ' (Líder)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                                {atualizandoAcompanhante === pessoa.id && (
                                  <span className="saving-label">Salvando...</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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

export default IntegracaoAcompanhamento;
