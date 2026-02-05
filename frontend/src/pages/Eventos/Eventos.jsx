import React, { useState, useMemo } from 'react';
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
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, FileText, Download } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Eventos.css';

const Eventos = () => {
  const [viewMode, setViewMode] = useState('month'); // 'week', 'month', 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
  const [message, setMessage] = useState({ type: '', text: '' });

  // Eventos mockados para visualização
  const [eventos, setEventos] = useState([
    {
      id: 1,
      titulo: 'Culto de Oração',
      descricao: 'Culto de oração semanal',
      data: '2024-12-15',
      hora: '19:00',
      local: 'Templo Principal',
      tipo: 'Culto'
    },
    {
      id: 2,
      titulo: 'Reunião de Jovens',
      descricao: 'Encontro semanal do ministério de jovens',
      data: '2024-12-18',
      hora: '20:00',
      local: 'Salão de Jovens',
      tipo: 'Reunião'
    },
    {
      id: 3,
      titulo: 'Escola Bíblica Dominical',
      descricao: 'Aulas da EBD',
      data: '2024-12-22',
      hora: '09:00',
      local: 'Salas de Aula',
      tipo: 'Ensino'
    },
    {
      id: 4,
      titulo: 'Culto de Celebração',
      descricao: 'Culto dominical de celebração',
      data: '2024-12-22',
      hora: '19:00',
      local: 'Templo Principal',
      tipo: 'Culto'
    },
    {
      id: 5,
      titulo: 'Reunião de Casais',
      descricao: 'Encontro do ministério de casais',
      data: '2024-12-20',
      hora: '19:30',
      local: 'Salão de Eventos',
      tipo: 'Reunião'
    }
  ]);

  // Tipos de eventos
  const tiposEventos = ['Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro'];

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
    setMessage({ type: '', text: '' });
  };

  // Submeter formulário (adicionar ou editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Simulação de API - TODO: Substituir por chamada real
      setTimeout(() => {
        if (editingEventId) {
          // Editar evento existente
          setEventos(eventos.map(evento => 
            evento.id === editingEventId 
              ? { ...eventoForm, id: editingEventId }
              : evento
          ));
          setMessage({ type: 'success', text: 'Evento atualizado com sucesso!' });
        } else {
          // Adicionar novo evento
          const novoEvento = {
            ...eventoForm,
            id: eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1
          };
          setEventos([...eventos, novoEvento]);
          setMessage({ type: 'success', text: 'Evento cadastrado com sucesso!' });
        }
        clearForm();
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar evento. Tente novamente.' });
      setLoading(false);
    }
  };

  // Editar evento
  const handleEdit = (evento) => {
    setEventoForm({
      titulo: evento.titulo,
      descricao: evento.descricao,
      data: evento.data,
      hora: evento.hora,
      local: evento.local,
      tipo: evento.tipo
    });
    setEditingEventId(evento.id);
    setMessage({ type: '', text: '' });
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Excluir evento
  const handleDelete = (eventoId) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      setEventos(eventos.filter(e => e.id !== eventoId));
      if (editingEventId === eventoId) {
        clearForm();
      }
      setMessage({ type: 'success', text: 'Evento excluído com sucesso!' });
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
    return eventos.filter(evento => evento.data === dateStr);
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
                onClick={() => {
                  if (isCurrent) {
                    // Criar novo evento neste dia
                    const newEvent = {
                      id: eventos.length + 1,
                      titulo: 'Novo Evento',
                      descricao: '',
                      data: formatDate(day),
                      hora: '19:00',
                      local: '',
                      tipo: 'Culto'
                    };
                    setEventos([...eventos, newEvent]);
                    setSelectedEvent(newEvent);
                    setIsEditing(true);
                  }
                }}
              >
                <div className="calendar-day-number">{day.getDate()}</div>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 3).map(evento => (
                    <div
                      key={evento.id}
                      className="calendar-event-dot"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(evento);
                      }}
                      title={evento.titulo}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="calendar-event-more">+{dayEvents.length - 3}</div>
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
                  <div className="calendar-year-events-count">
                    {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}
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
              <TabsTrigger value="relatorios" className="eventos-tabs-trigger">
                <FileText className="tab-icon" />
                <span>Relatórios</span>
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

                {/* Painel de detalhes do evento */}
                {selectedEvent && (
                  <div className="event-details-panel">
                    <div className="event-details-header">
                      <h3>{selectedEvent.titulo}</h3>
                      <div className="event-details-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditing(!isEditing);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEventos(eventos.filter(e => e.id !== selectedEvent.id));
                            setSelectedEvent(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                      {isEditing ? (
                        <div className="event-edit-form">
                          <div className="form-group">
                            <label>Título</label>
                            <input
                              type="text"
                              value={selectedEvent.titulo}
                              onChange={(e) => {
                                const updated = { ...selectedEvent, titulo: e.target.value };
                                setSelectedEvent(updated);
                                setEventos(eventos.map(e => e.id === selectedEvent.id ? updated : e));
                              }}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Data</label>
                            <input
                              type="date"
                              value={selectedEvent.data}
                              onChange={(e) => {
                                const updated = { ...selectedEvent, data: e.target.value };
                                setSelectedEvent(updated);
                                setEventos(eventos.map(e => e.id === selectedEvent.id ? updated : e));
                              }}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Hora</label>
                            <input
                              type="time"
                              value={selectedEvent.hora}
                              onChange={(e) => {
                                const updated = { ...selectedEvent, hora: e.target.value };
                                setSelectedEvent(updated);
                                setEventos(eventos.map(e => e.id === selectedEvent.id ? updated : e));
                              }}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Local</label>
                            <input
                              type="text"
                              value={selectedEvent.local}
                              onChange={(e) => {
                                const updated = { ...selectedEvent, local: e.target.value };
                                setSelectedEvent(updated);
                                setEventos(eventos.map(e => e.id === selectedEvent.id ? updated : e));
                              }}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Descrição</label>
                            <textarea
                              value={selectedEvent.descricao}
                              onChange={(e) => {
                                const updated = { ...selectedEvent, descricao: e.target.value };
                                setSelectedEvent(updated);
                                setEventos(eventos.map(e => e.id === selectedEvent.id ? updated : e));
                              }}
                              className="form-textarea"
                              rows="4"
                            />
                          </div>
                          <Button
                            onClick={() => setIsEditing(false)}
                            className="submit-button"
                          >
                            Salvar
                          </Button>
                        </div>
                      ) : (
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
                      )}
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
                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

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
                        {eventos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              Nenhum evento cadastrado ainda.
                            </TableCell>
                          </TableRow>
                        ) : (
                          eventos.map((evento) => (
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
                                    onClick={() => handleDelete(evento.id)}
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="relatorios" className="eventos-tabs-content">
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
    nomeMinisterio: 'Ministério Eventos',
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
          nomeMinisterio: 'Ministério Eventos',
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
        nomeMinisterio: 'Ministério Eventos',
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

export default Eventos;
