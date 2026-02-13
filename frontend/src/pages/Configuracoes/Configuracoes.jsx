import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import BackToDashboard from '../../components/BackToDashboard/BackToDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { User, Settings, Upload, X, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';
import { compressImageForUpload } from '../../utils/compressImage';
import './Configuracoes.css';

const VIA_CEP_URL = 'https://viacep.com.br/ws';

const Configuracoes = () => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
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
  const [loadingUserData, setLoadingUserData] = useState(true);

  // Estados para formulário de Sistema
  const [sistemaFormData, setSistemaFormData] = useState({
    email: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [loadingSistema, setLoadingSistema] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null);

  // Carregar dados completos do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoadingUserData(true);
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        
        setFormData({
          nome: userData.nome || '',
          sobrenome: userData.sobrenome || '',
          email: userData.email || '',
          telefone: userData.telefone || '',
          dataNascimento: userData.dataNascimento || '',
          sexo: userData.sexo || '',
          estadoCivil: userData.estadoCivil || '',
          cep: userData.cep || '',
          rua: userData.rua || '',
          numero: userData.numero || '',
          complemento: userData.complemento || '',
          bairro: userData.bairro || '',
          cidade: userData.cidade || '',
          estado: userData.estado || ''
        });
        setFotoPerfilPreview(userData.fotoPerfil || null);
        setSistemaFormData({
          email: userData.email || '',
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        });
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados do usuário. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoadingUserData(false);
      }
    };

    if (authUser) {
      loadUserData();
    }
  }, [authUser, toast]);

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione apenas arquivos de imagem.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const compressed = await compressImageForUpload(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.88 });
        setFotoPerfil(compressed);
        const reader = new FileReader();
        reader.onloadend = () => setFotoPerfilPreview(reader.result);
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error('Erro ao comprimir imagem:', err);
        toast({
          title: 'Erro',
          description: 'Erro ao processar imagem. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoverFoto = () => {
    setFotoPerfil(null);
    setFotoPerfilPreview(null);
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

    // Validações
    if (!sistemaFormData.email) {
      toast({
        title: 'Erro',
        description: 'O email é obrigatório.',
        variant: 'destructive',
      });
      setLoadingSistema(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sistemaFormData.email)) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      setLoadingSistema(false);
      return;
    }

    try {
      // Atualizar email se mudou
      if (sistemaFormData.email !== formData.email) {
        await api.put('/auth/me/email', { email: sistemaFormData.email });
        toast({
          title: 'Sucesso',
          description: 'Email atualizado com sucesso!',
          variant: 'success',
        });
        // Atualizar formData também
        setFormData(prev => ({ ...prev, email: sistemaFormData.email }));
      }

      // Atualizar senha se fornecida
      if (sistemaFormData.senhaAtual && sistemaFormData.novaSenha) {
        if (sistemaFormData.novaSenha.length < 6) {
          toast({
            title: 'Erro',
            description: 'A nova senha deve ter no mínimo 6 caracteres.',
            variant: 'destructive',
          });
          setLoadingSistema(false);
          return;
        }

        if (sistemaFormData.novaSenha !== sistemaFormData.confirmarSenha) {
          toast({
            title: 'Erro',
            description: 'As senhas não coincidem.',
            variant: 'destructive',
          });
          setLoadingSistema(false);
          return;
        }

        await api.put('/auth/me/password', {
          senhaAtual: sistemaFormData.senhaAtual,
          novaSenha: sistemaFormData.novaSenha,
        });
        toast({
          title: 'Sucesso',
          description: 'Senha atualizada com sucesso!',
          variant: 'success',
        });
      }

      // Limpar campos de senha após sucesso
      setSistemaFormData(prev => ({
        ...prev,
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      }));

      if (!sistemaFormData.senhaAtual && sistemaFormData.email === formData.email) {
        toast({
          title: 'Info',
          description: 'Nenhuma alteração foi feita.',
          variant: 'info',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar configurações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
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

  // ViaCEP: busca endereço pelo CEP e preenche o formulário
  const fetchViaCep = async (cep) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) return null;
      
      const res = await fetch(`${VIA_CEP_URL}/${cepLimpo}/json/`);
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

  const handleCepBlur = async (e) => {
    const cep = e.target.value || '';
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
      const endereco = await fetchViaCep(cep);
      if (endereco) {
        setFormData(prev => ({ ...prev, ...endereco }));
        toast({ 
          title: 'CEP encontrado', 
          description: 'Endereço preenchido automaticamente.',
          variant: 'success',
        });
      } else {
        toast({ 
          title: 'CEP não encontrado', 
          description: 'Verifique o número e tente novamente.', 
          variant: 'destructive' 
        });
      }
    }
  };

  // Função auxiliar para converter arquivo em base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validações básicas - apenas nome e email são obrigatórios
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      toast({
        title: 'Erro',
        description: 'Email é obrigatório.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        fotoPerfil: fotoPerfil ? await fileToBase64(fotoPerfil) : undefined,
      };

      const response = await api.put('/pessoas/me', payload);
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
        variant: 'success',
      });

      // Atualizar preview da foto se foi alterada
      if (fotoPerfil) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotoPerfilPreview(reader.result);
        };
        reader.readAsDataURL(fotoPerfil);
        setFotoPerfil(null);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar perfil. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
<div className="dashboard-content">
          <BackToDashboard />
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
                
                {loadingUserData ? (
                  <div className="loading-message">Carregando dados do usuário...</div>
                ) : (
                <form onSubmit={handleSubmit} className="perfil-form">

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
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="form-input"
                        maxLength={9}
                      />
                      <span className="cep-hint" style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px', display: 'block' }}>
                        Digite o CEP e saia do campo para preencher o endereço automaticamente
                      </span>
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
                )}
              </div>
            </TabsContent>

            <TabsContent value="sistema" className="configuracoes-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Configurações do Sistema</h2>
                
                {loadingUserData ? (
                  <div className="loading-message">Carregando dados do usuário...</div>
                ) : (
                <form onSubmit={handleSistemaSubmit} className="perfil-form">

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
                      <PasswordInput
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
                      <PasswordInput
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
                      <PasswordInput
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
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default Configuracoes;
