import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
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
import './Eventos.css';

const Eventos = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState('month'); // 'week', 'month', 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Estados para formulário de novo evento
  const [eventoForm, setEventoForm] = useState({
    titulo: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    hora: '19:00',
    local: '',
    tipo: 'Culto'
  });
  const [editingEventId, setEditingEventId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [eventos, setEventos] = useState([]); // Eventos para o calendário (todos)
  const [eventosTabela, setEventosTabela] = useState([]); // Eventos para a tabela (paginados)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventoParaExcluir, setEventoParaExcluir] = useState(null);

  // Tipos de eventos
  const tiposEventos = ['Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro'];

  // Carregar eventos (todos para o calendário, paginados para a tabela)
  const loadEventos = async (forCalendar = false) => {
    setLoadingEventos(true);
    try {
      if (forCalendar) {
        // Carregar todos os eventos para o calendário (usar limite máximo permitido: 100)
        const response = await api.get('/eventos', { 
          params: { page: 1, pageSize: 100 } 
        });
        let allEventos = [...(response.data.eventos || [])];
        
        // Se houver mais páginas, carregar todas
        if (response.data.pagination && response.data.pagination.totalPages > 1) {
          for (let page = 2; page <= response.data.pagination.totalPages; page++) {
            const nextResponse = await api.get('/eventos', {
              params: { page, pageSize: 100 }
            });
            allEventos.push(...(nextResponse.data.eventos || []));
          }
        }
        setEventos(allEventos);
      } else {
        // Carregar eventos paginados para a tabela
        const response = await api.get('/eventos', {
          params: { page: pagination.page, pageSize: pagination.pageSize }
        });
        setEventosTabela(response.data.eventos || []);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.data.pagination
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar eventos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingEventos(false);
    }
  };

  // Carregar todos os eventos ao montar o componente (para o calendário)
  useEffect(() => {
    loadEventos(true); // Carregar todos os eventos para o calendário
    loadEventos(false); // Carregar eventos paginados para a tabela
  }, []);

  // Carregar eventos paginados quando a página da tabela mudar
  useEffect(() => {
    loadEventos(false);
  }, [pagination.page]);

  // Manipular mudanças no formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEventoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpar formulário
  const clearForm = () => {
    setEventoForm({
      titulo: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      hora: '19:00',
      local: '',
      tipo: 'Culto'
    });
    setEditingEventId(null);
  };

  // Submeter formulário (adicionar ou editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEventId) {
        // Editar evento existente
        await api.put(`/eventos/${editingEventId}`, eventoForm);
        toast({
          title: 'Sucesso',
          description: 'Evento atualizado com sucesso!',
        });
      } else {
        // Adicionar novo evento
        await api.post('/eventos', eventoForm);
        toast({
          title: 'Sucesso',
          description: 'Evento cadastrado com sucesso!',
        });
      }
      clearForm();
      loadEventos(true); // Recarregar todos os eventos para o calendário
      loadEventos(false); // Recarregar eventos paginados para a tabela
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar evento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Editar evento
  const handleEdit = (evento) => {
    setEventoForm({
      titulo: evento.titulo,
      descricao: evento.descricao || '',
      data: evento.data,
      hora: evento.hora,
      local: evento.local,
      tipo: evento.tipo
    });
    setEditingEventId(evento.id);
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Abrir dialog de exclusão
  const handleDeleteClick = (eventoId) => {
    setEventoParaExcluir(eventoId);
    setDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!eventoParaExcluir) return;

    try {
      await api.delete(`/eventos/${eventoParaExcluir}`);
      toast({
        title: 'Sucesso',
        description: 'Evento excluído com sucesso!',
      });
      if (editingEventId === eventoParaExcluir) {
        clearForm();
      }
      setDeleteDialogOpen(false);
      setEventoParaExcluir(null);
      loadEventos(true); // Recarregar todos os eventos para o calendário
      loadEventos(false); // Recarregar eventos paginados para a tabela
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir evento. Tente novamente.',
        variant: 'destructive'
      });
      setDeleteDialogOpen(false);
      setEventoParaExcluir(null);
    }
  };

  // Formatar data para exibição
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Navegação de datas
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Obter início da semana
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Obter dias da semana
  const getWeekDays = () => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  // Obter dias do mês
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Dias do mês anterior
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonth.getDate() - i));
    }
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    // Dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  // Obter meses do ano
  const getYearMonths = () => {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  };

  // Formatar data
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Verificar se é hoje
  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  // Obter eventos do dia
  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    // Normalizar a data do evento (pode vir como string ISO ou apenas data)
    return eventos.filter(evento => {
      if (!evento.data) return false;
      // Se a data vier como string ISO (com hora), pegar apenas a parte da data
      const eventoData = evento.data.split('T')[0];
      return eventoData === dateStr;
    });
  };

  // Obter eventos do mês
  const getEventsForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return eventos.filter(evento => {
      const eventDate = new Date(evento.data);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // Renderizar visualização semanal
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    return (
      <div className="calendar-week-view">
        <div className="calendar-week-header">
          {weekDays.map((day, index) => (
            <div key={index} className="calendar-week-day-header">
              <div className="calendar-day-name">
                {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </div>
              <div className={`calendar-day-number ${isToday(day) ? 'today' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="calendar-week-body">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            return (
              <div key={index} className="calendar-week-day-cell">
                {dayEvents.map(evento => (
                  <div
                    key={evento.id}
                    className="calendar-event-item"
                    onClick={() => setSelectedEvent(evento)}
                  >
                    <span className="event-time">{evento.hora}</span>
                    <span className="event-title">{evento.titulo}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização mensal
  const renderMonthView = () => {
    const monthDays = getMonthDays();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const isCurrentMonth = (date) => {
      return date.getMonth() === currentDate.getMonth() && 
             date.getFullYear() === currentDate.getFullYear();
    };

    return (
      <div className="calendar-month-view">
        <div className="calendar-month-header">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="calendar-month-day-name">{day}</div>
          ))}
        </div>
        <div className="calendar-month-grid">
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrent = isCurrentMonth(day);
            return (
              <div
                key={index}
                className={`calendar-month-day-cell ${!isCurrent ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
              >
                <div className="calendar-day-number">{day.getDate()}</div>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 2).map(evento => (
                    <div
                      key={evento.id}
                      className="calendar-event-title"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(evento);
                      }}
                      title={`${evento.hora} - ${evento.titulo}`}
                    >
                      <span className="event-title-text">{evento.titulo}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="calendar-event-more">+{dayEvents.length - 2} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização anual
  const renderYearView = () => {
    const yearMonths = getYearMonths();
    return (
      <div className="calendar-year-view">
        {yearMonths.map((month, index) => {
          const monthEvents = getEventsForMonth(month);
          return (
            <div key={index} className="calendar-year-month">
              <div className="calendar-year-month-header">
                {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <div className="calendar-year-month-events">
                {monthEvents.length > 0 ? (
                  <div className="calendar-year-events-list">
                    {monthEvents.map(evento => (
                      <div
                        key={evento.id}
                        className="calendar-year-event-item"
                        onClick={() => setSelectedEvent(evento)}
                        title={`${evento.data} ${evento.hora} - ${evento.titulo}`}
                      >
                        <div className="calendar-year-event-date">
                          {new Date(evento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="calendar-year-event-info">
                          <div className="calendar-year-event-time">{evento.hora}</div>
                          <div className="calendar-year-event-title">{evento.titulo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="calendar-year-no-events">Sem eventos</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Obter título da visualização
  const getViewTitle = () => {
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (viewMode === 'month') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Eventos</h1>
          
          <Tabs defaultValue="agenda" className="eventos-tabs">
            <TabsList className="eventos-tabs-list">
              <TabsTrigger value="agenda" className="eventos-tabs-trigger">
                <Calendar className="tab-icon" />
                <span>Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="novo-evento" className="eventos-tabs-trigger">
                <Plus className="tab-icon" />
                <span>Novo Evento</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="agenda" className="eventos-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Agenda de Eventos</h2>
                
                {/* Controles de visualização */}
                <div className="calendar-controls">
                  <div className="calendar-view-mode">
                    <Button
                      variant={viewMode === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('week')}
                    >
                      Semana
                    </Button>
                    <Button
                      variant={viewMode === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('month')}
                    >
                      Mês
                    </Button>
                    <Button
                      variant={viewMode === 'year' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('year')}
                    >
                      Ano
                    </Button>
                  </div>
                  
                  <div className="calendar-navigation">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="calendar-current-date">
                      {getViewTitle()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Hoje
                    </Button>
                  </div>
                </div>

                {/* Visualização do calendário */}
                <div className="calendar-container">
                  {viewMode === 'week' && renderWeekView()}
                  {viewMode === 'month' && renderMonthView()}
                  {viewMode === 'year' && renderYearView()}
                </div>

                {/* Painel de detalhes do evento - Apenas visualização (página pública) */}
                {selectedEvent && (
                  <div className="event-details-panel">
                    <div className="event-details-header">
                      <h3>{selectedEvent.titulo}</h3>
                      <div className="event-details-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvent(null)}
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                    <div className="event-details-content">
                      <div className="event-details-info">
                        <div className="event-info-item">
                          <strong>Data:</strong> {new Date(selectedEvent.data).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="event-info-item">
                          <strong>Hora:</strong> {selectedEvent.hora}
                        </div>
                        <div className="event-info-item">
                          <strong>Local:</strong> {selectedEvent.local}
                        </div>
                        <div className="event-info-item">
                          <strong>Tipo:</strong> {selectedEvent.tipo}
                        </div>
                        {selectedEvent.descricao && (
                          <div className="event-info-item">
                            <strong>Descrição:</strong>
                            <p>{selectedEvent.descricao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="novo-evento" className="eventos-tabs-content">
              <div className="tab-content-wrapper">
                <h2>{editingEventId ? 'Editar Evento' : 'Novo Evento'}</h2>
                
                {/* Formulário */}
                <form onSubmit={handleSubmit} className="evento-form">
                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="titulo">Título do Evento</Label>
                      <Input
                        type="text"
                        id="titulo"
                        name="titulo"
                        value={eventoForm.titulo}
                        onChange={handleFormChange}
                        placeholder="Digite o título do evento"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="data">Data</Label>
                      <Input
                        type="date"
                        id="data"
                        name="data"
                        value={eventoForm.data}
                        onChange={handleFormChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="hora">Hora</Label>
                      <Input
                        type="time"
                        id="hora"
                        name="hora"
                        value={eventoForm.hora}
                        onChange={handleFormChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="local">Local</Label>
                      <Input
                        type="text"
                        id="local"
                        name="local"
                        value={eventoForm.local}
                        onChange={handleFormChange}
                        placeholder="Digite o local do evento"
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="tipo">Tipo de Evento</Label>
                      <select
                        id="tipo"
                        name="tipo"
                        value={eventoForm.tipo}
                        onChange={handleFormChange}
                        required
                        className="form-select"
                      >
                        {tiposEventos.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="descricao">Descrição</Label>
                      <textarea
                        id="descricao"
                        name="descricao"
                        value={eventoForm.descricao}
                        onChange={handleFormChange}
                        placeholder="Digite a descrição do evento"
                        rows="4"
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      className="submit-button"
                      disabled={loading}
                    >
                      {loading 
                        ? (editingEventId ? 'Atualizando...' : 'Cadastrando...') 
                        : (editingEventId ? 'Atualizar Evento' : 'Cadastrar Evento')
                      }
                    </Button>
                    {editingEventId && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={clearForm}
                        className="cancel-button"
                      >
                        Cancelar Edição
                      </Button>
                    )}
                  </div>
                </form>

                {/* Tabela de Eventos */}
                <div style={{ marginTop: '48px' }}>
                  <h2 style={{ marginBottom: '24px' }}>Todos os Eventos</h2>
                  {loadingEventos ? (
                    <div className="text-center" style={{ padding: '40px' }}>
                      Carregando eventos...
                    </div>
                  ) : (
                    <>
                      <div className="table-wrapper">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Título</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Hora</TableHead>
                              <TableHead>Local</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead style={{ textAlign: 'center' }}>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventosTabela.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                  Nenhum evento cadastrado ainda.
                                </TableCell>
                              </TableRow>
                            ) : (
                              eventosTabela.map((evento) => (
                                <TableRow key={evento.id}>
                                  <TableCell>
                                    <strong>{evento.titulo}</strong>
                                  </TableCell>
                                  <TableCell>{formatDateDisplay(evento.data)}</TableCell>
                                  <TableCell>{evento.hora}</TableCell>
                                  <TableCell>{evento.local}</TableCell>
                                  <TableCell>{evento.tipo}</TableCell>
                                  <TableCell className="max-w-xs truncate" title={evento.descricao}>
                                    {evento.descricao || '-'}
                                  </TableCell>
                                  <TableCell style={{ textAlign: 'center' }}>
                                    <div className="table-actions">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(evento)}
                                        className="action-button edit-button"
                                      >
                                        <Edit className="action-icon" />
                                        Editar
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteClick(evento.id)}
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
                      {pagination.totalPages > 1 && (
                        <div className="pagination" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          <span>
                            Página {pagination.page} de {pagination.totalPages} ({pagination.total} eventos)
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages}
                          >
                            Próxima
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Dialog de confirmação de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setDeleteDialogOpen(false);
                    setEventoParaExcluir(null);
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

          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default Eventos;
