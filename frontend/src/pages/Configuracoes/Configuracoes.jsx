import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { User, Settings, Upload, X, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import './Configuracoes.css';

const Configuracoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    sexo: '',
    estadoCivil: '',
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

  // Estados para formulário de Sistema
  const [sistemaFormData, setSistemaFormData] = useState({
    email: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [loadingSistema, setLoadingSistema] = useState(false);
  const [messageSistema, setMessageSistema] = useState({ type: '', text: '' });
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(user?.fotoPerfil || null);

  useEffect(() => {
    // Preencher formulário com dados do usuário
    if (user) {
      setFormData({
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        dataNascimento: user.dataNascimento || '',
        sexo: user.sexo || '',
        estadoCivil: user.estadoCivil || '',
        cep: user.cep || '',
        rua: user.rua || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        estado: user.estado || ''
      });
      setFotoPerfilPreview(user.fotoPerfil || null);
      setSistemaFormData({
        email: user.email || '',
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
    }
  }, [user]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione apenas arquivos de imagem.' });
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
        return;
      }

      setFotoPerfil(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfilPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverFoto = () => {
    setFotoPerfil(null);
    setFotoPerfilPreview(user?.fotoPerfil || null);
    const fileInput = document.getElementById('fotoPerfil');
    if (fileInput) fileInput.value = '';
  };

  const handleSistemaChange = (e) => {
    const { name, value } = e.target;
    setSistemaFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSistemaSubmit = async (e) => {
    e.preventDefault();
    setLoadingSistema(true);
    setMessageSistema({ type: '', text: '' });

    // Validações
    if (!sistemaFormData.email) {
      setMessageSistema({ type: 'error', text: 'O email é obrigatório.' });
      setLoadingSistema(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sistemaFormData.email)) {
      setMessageSistema({ type: 'error', text: 'Por favor, insira um email válido.' });
      setLoadingSistema(false);
      return;
    }

    // Se estiver alterando a senha, validar campos de senha
    if (sistemaFormData.senhaAtual || sistemaFormData.novaSenha || sistemaFormData.confirmarSenha) {
      if (!sistemaFormData.senhaAtual) {
        setMessageSistema({ type: 'error', text: 'Por favor, informe a senha atual.' });
        setLoadingSistema(false);
        return;
      }

      if (!sistemaFormData.novaSenha) {
        setMessageSistema({ type: 'error', text: 'Por favor, informe a nova senha.' });
        setLoadingSistema(false);
        return;
      }

      if (sistemaFormData.novaSenha.length < 6) {
        setMessageSistema({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
        setLoadingSistema(false);
        return;
      }

      if (sistemaFormData.novaSenha !== sistemaFormData.confirmarSenha) {
        setMessageSistema({ type: 'error', text: 'As senhas não coincidem.' });
        setLoadingSistema(false);
        return;
      }
    }

    try {
      // Simulação de atualização - TODO: Substituir por chamada real à API
      setTimeout(() => {
        setMessageSistema({ type: 'success', text: 'Configurações atualizadas com sucesso!' });
        setLoadingSistema(false);
        // Limpar campos de senha após sucesso
        setSistemaFormData(prev => ({
          ...prev,
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        }));
      }, 1000);
    } catch (error) {
      setMessageSistema({ type: 'error', text: 'Erro ao atualizar configurações. Tente novamente.' });
      setLoadingSistema(false);
    }
  };

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
      // Simulação de atualização - TODO: Substituir por chamada real à API
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Configurações</h1>
          
          <Tabs defaultValue="perfil" className="configuracoes-tabs">
            <TabsList className="configuracoes-tabs-list">
              <TabsTrigger value="perfil" className="configuracoes-tabs-trigger">
                <User className="tab-icon" />
                <span>Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="sistema" className="configuracoes-tabs-trigger">
                <Settings className="tab-icon" />
                <span>Sistema</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="perfil" className="configuracoes-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Editar Perfil</h2>
                
                <form onSubmit={handleSubmit} className="perfil-form">
                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

                  {/* Campo de Foto de Perfil */}
                  <div className="form-row">
                    <div className="form-group">
                      <Label>Foto de Perfil</Label>
                      <div className="foto-perfil-wrapper">
                        <div className="foto-perfil-avatar">
                          <Avatar className="foto-avatar">
                            <AvatarImage 
                              src={fotoPerfilPreview} 
                              alt="Foto de perfil"
                            />
                            <AvatarFallback>
                              {formData.nome && formData.sobrenome 
                                ? `${formData.nome.charAt(0)}${formData.sobrenome.charAt(0)}`.toUpperCase()
                                : formData.nome 
                                  ? formData.nome.charAt(0).toUpperCase()
                                  : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <label htmlFor="fotoPerfil" className="avatar-edit-button">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="avatar-edit-icon-button"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('fotoPerfil')?.click();
                              }}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          </label>
                          {fotoPerfilPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="avatar-remove-button"
                              onClick={handleRemoverFoto}
                              title="Remover foto"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="foto-upload-controls">
                          <Input
                            type="file"
                            id="fotoPerfil"
                            name="fotoPerfil"
                            onChange={handleFotoChange}
                            accept="image/*"
                            className="foto-input-hidden"
                          />
                          <p className="foto-hint">Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB</p>
                        </div>
                      </div>
                    </div>
                  </div>

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
                        placeholder="Digite o sobrenome"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
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

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        type="date"
                        id="dataNascimento"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="sexo">Sexo</Label>
                      <select
                        id="sexo"
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">Selecione (opcional)</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                        <option value="nao-informar">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <select
                        id="estadoCivil"
                        name="estadoCivil"
                        value={formData.estadoCivil}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">Selecione (opcional)</option>
                        <option value="solteiro">Solteiro(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viuvo">Viúvo(a)</option>
                        <option value="uniao-estavel">União Estável</option>
                      </select>
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
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="sistema" className="configuracoes-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Configurações do Sistema</h2>
                
                <form onSubmit={handleSistemaSubmit} className="perfil-form">
                  {messageSistema.text && (
                    <div className={`form-message ${messageSistema.type}`}>
                      {messageSistema.text}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="sistema-email">Email</Label>
                      <Input
                        type="email"
                        id="sistema-email"
                        name="email"
                        value={sistemaFormData.email}
                        onChange={handleSistemaChange}
                        placeholder="email@exemplo.com"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-section-divider">
                    <h3>Alterar Senha</h3>
                    <p className="section-description">Deixe em branco se não desejar alterar a senha</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="senhaAtual">Senha Atual</Label>
                      <Input
                        type="password"
                        id="senhaAtual"
                        name="senhaAtual"
                        value={sistemaFormData.senhaAtual}
                        onChange={handleSistemaChange}
                        placeholder="Digite sua senha atual"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input
                        type="password"
                        id="novaSenha"
                        name="novaSenha"
                        value={sistemaFormData.novaSenha}
                        onChange={handleSistemaChange}
                        placeholder="Digite a nova senha"
                        className="form-input"
                      />
                      <p className="field-hint">Mínimo de 6 caracteres</p>
                    </div>
                    <div className="form-group">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input
                        type="password"
                        id="confirmarSenha"
                        name="confirmarSenha"
                        value={sistemaFormData.confirmarSenha}
                        onChange={handleSistemaChange}
                        placeholder="Confirme a nova senha"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      className="submit-button"
                      disabled={loadingSistema}
                    >
                      {loadingSistema ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default Configuracoes;
