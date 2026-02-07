import React, { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { ClipboardList, ChevronLeft, ChevronRight, Camera, X, Edit } from 'lucide-react';
import './FichaMembros.css';

const FichaMembros = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fichaSalva, setFichaSalva] = useState(null);
  const [editando, setEditando] = useState(false);
  
  // Definir etapas do formulário
  const steps = [
    { id: 0, title: 'Identificação' },
    { id: 1, title: 'Endereço' },
    { id: 2, title: 'Contato' },
    { id: 3, title: 'Dados Pessoais' },
    { id: 4, title: 'Informações Familiares' },
    { id: 5, title: 'Membro' },
    { id: 6, title: 'Consagração' },
    { id: 7, title: 'Função Ministerial' },
    { id: 8, title: 'Foto' },
    { id: 9, title: 'Observações' }
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Função para obter data atual no formato YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    // Identificação
    numeroRegistro: '',
    dataRegistro: getCurrentDate(),
    cpf: '',
    nome: '',
    conhecidoPor: '',
    
    // Endereço
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    endereco: '',
    numeroEndereco: '',
    complemento: '',
    
    // Contato
    telefoneComercial: '',
    numeroTelefone: '',
    numeroCelular: '',
    numeroCelular2: '',
    email: '',
    
    // Dados Pessoais
    sexo: '',
    estadoCivil: '',
    dataNascimento: '',
    naturalidade: '',
    naturalidadeUF: '',
    nacionalidade: '',
    numeroRG: '',
    rgDataEmissao: '',
    rgOrgaoEmissor: '',
    escolaridade: '',
    profissao: '',
    tipoSanguineo: '',
    
    // Informações Familiares
    nomePai: '',
    nomeMae: '',
    nomeConjuge: '',
    dataCasamento: '',
    quantidadeFilhos: '',
    quantidadeMaiores: '',
    quantidadeMenores: '',
    
    // Informações Eclesiásticas
    foiCasadoAnteriormente: '',
    
    // Membro
    dataBatismo: '',
    localBatismo: '',
    igrejaOndeFoiBatizado: '',
    dataAdmissaoMinisterial: '',
    tipoAdmissaoMinisterial: '',
    igrejaOuMinisterioAnterior: '',
    
    // Consagração
    dataConsagracao: '',
    consagracaoMinisterial: '',
    localConsagracao: '',
    consagradoPor: '',
    
    // Função Ministerial
    funcao: '',
    ministerioIntegracao: '',
    
    // Foto
    foto: null,
    
    // Observações
    observacoes: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      // Formatar CEP: 00000-000
      if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5);
      }
      setFormData(prev => ({
        ...prev,
        cep: value
      }));
    }
  };

  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            cep: data.cep || cep.substring(0, 5) + '-' + cep.substring(5),
            endereco: data.logradouro || prev.endereco,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
          toast({
            title: 'Sucesso!',
            description: 'Endereço preenchido automaticamente.',
          });
        } else {
          toast({
            title: 'Aviso',
            description: 'CEP não encontrado. Preencha o endereço manualmente.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao buscar CEP. Tente novamente.',
          variant: 'destructive',
        });
      }
    } else if (cep.length > 0 && cep.length < 8) {
      toast({
        title: 'Aviso',
        description: 'CEP deve ter 8 dígitos.',
        variant: 'destructive',
      });
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione apenas arquivos de imagem.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setFoto(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    const fileInput = document.getElementById('fotoMembro');
    if (fileInput) fileInput.value = '';
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implementar chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Criar objeto com os dados da ficha salva (incluindo foto se houver)
      const fichaCompleta = {
        ...formData,
        foto: fotoPreview || null,
        id: Date.now(), // ID temporário até implementar API
        dataSalvamento: new Date().toLocaleString('pt-BR')
      };
      
      // Salvar a ficha
      setFichaSalva(fichaCompleta);
      setEditando(false);
      
      toast({
        title: 'Sucesso!',
        description: 'Ficha cadastral salva com sucesso!',
      });
      
      // Limpar formulário após sucesso
      setFormData({
        numeroRegistro: '',
        dataRegistro: getCurrentDate(),
        cpf: '',
        nome: '',
        conhecidoPor: '',
        cep: '',
        estado: '',
        cidade: '',
        bairro: '',
        endereco: '',
        numeroEndereco: '',
        complemento: '',
        telefoneComercial: '',
        numeroTelefone: '',
        numeroCelular: '',
        numeroCelular2: '',
        email: '',
        sexo: '',
        estadoCivil: '',
        dataNascimento: '',
        naturalidade: '',
        naturalidadeUF: '',
        nacionalidade: '',
        numeroRG: '',
        rgDataEmissao: '',
        rgOrgaoEmissor: '',
        escolaridade: '',
        profissao: '',
        tipoSanguineo: '',
        nomePai: '',
        nomeMae: '',
        nomeConjuge: '',
        dataCasamento: '',
        quantidadeFilhos: '',
        quantidadeMaiores: '',
        quantidadeMenores: '',
        foiCasadoAnteriormente: '',
        dataBatismo: '',
        localBatismo: '',
        igrejaOndeFoiBatizado: '',
        dataAdmissaoMinisterial: '',
        tipoAdmissaoMinisterial: '',
        igrejaOuMinisterioAnterior: '',
        dataConsagracao: '',
        consagracaoMinisterial: '',
        localConsagracao: '',
        consagradoPor: '',
        funcao: '',
        ministerioIntegracao: '',
        foto: null,
        observacoes: ''
      });
      
      // Limpar foto
      setFoto(null);
      setFotoPreview(null);
      
      // Voltar para primeira etapa
      setCurrentStep(0);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar ficha cadastral. Tente novamente.',
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
          <h1>Ficha de Membros</h1>
          
          <Tabs defaultValue="ficha-membro" className="ficha-membros-tabs">
            <TabsList className="ficha-membros-tabs-list">
              <TabsTrigger value="ficha-membro" className="ficha-membros-tabs-trigger">
                <ClipboardList className="tab-icon" />
                <span>Ficha de Membro</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ficha-membro" className="ficha-membros-tabs-content">
              <div className="tab-content-wrapper">
                <div className="ficha-membros-header">
                  <p className="header-description">
                    Preencha todos os campos com letra legível ou em formato de máquina
                  </p>
                </div>

                {/* Barra de Progresso */}
                <div className="progress-container">
                  <Progress value={progress} className="progress-bar" />
                </div>

                <form onSubmit={handleSubmit} className="ficha-form">
                  {/* Etapa 0: Identificação */}
                  {currentStep === 0 && (
            <section className="form-section">
              <h2 className="section-title">Identificação</h2>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="dataRegistro">Dt. Registro</Label>
                  <Input
                    type="date"
                    id="dataRegistro"
                    name="dataRegistro"
                    value={formData.dataRegistro}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="conhecidoPor">Conhecido por</Label>
                  <Input
                    type="text"
                    id="conhecidoPor"
                    name="conhecidoPor"
                    value={formData.conhecidoPor}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 1: Endereço */}
                  {currentStep === 1 && (
            <section className="form-section">
              <h2 className="section-title">Endereço</h2>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    type="text"
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleCepChange}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="form-input"
                    maxLength={9}
                  />
                  <span className="cep-hint">Digite o CEP e saia do campo para preencher o endereço automaticamente</span>
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    type="text"
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
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
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    type="text"
                    id="bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group" style={{ flex: 2 }}>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    type="text"
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="numeroEndereco">Nº</Label>
                  <Input
                    type="text"
                    id="numeroEndereco"
                    name="numeroEndereco"
                    value={formData.numeroEndereco}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    type="text"
                    id="complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 2: Contato */}
                  {currentStep === 2 && (
            <section className="form-section">
              <h2 className="section-title">Contato</h2>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="telefoneComercial">Tel. Comercial</Label>
                  <Input
                    type="tel"
                    id="telefoneComercial"
                    name="telefoneComercial"
                    value={formData.telefoneComercial}
                    onChange={handleChange}
                    placeholder="(00) 0000-0000"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="numeroTelefone">Nº Telefone</Label>
                  <Input
                    type="tel"
                    id="numeroTelefone"
                    name="numeroTelefone"
                    value={formData.numeroTelefone}
                    onChange={handleChange}
                    placeholder="(00) 0000-0000"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="numeroCelular">Nº Celular</Label>
                  <Input
                    type="tel"
                    id="numeroCelular"
                    name="numeroCelular"
                    value={formData.numeroCelular}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="numeroCelular2">Nº Celular (2º)</Label>
                  <Input
                    type="tel"
                    id="numeroCelular2"
                    name="numeroCelular2"
                    value={formData.numeroCelular2}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 3: Dados Pessoais */}
                  {currentStep === 3 && (
            <section className="form-section">
              <h2 className="section-title">Dados Pessoais</h2>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="sexo">Sexo</Label>
                  <select
                    id="sexo"
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                    <option value="nao-informar">Prefiro não informar</option>
                  </select>
                </div>
                <div className="form-group">
                  <Label htmlFor="estadoCivil">Estado Civil</Label>
                  <select
                    id="estadoCivil"
                    name="estadoCivil"
                    value={formData.estadoCivil}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Selecione</option>
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
                  <Label htmlFor="dataNascimento">Dt. Nascimento</Label>
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
                  <Label htmlFor="naturalidade">Naturalidade</Label>
                  <Input
                    type="text"
                    id="naturalidade"
                    name="naturalidade"
                    value={formData.naturalidade}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="naturalidadeUF">Naturalidade UF</Label>
                  <Input
                    type="text"
                    id="naturalidadeUF"
                    name="naturalidadeUF"
                    value={formData.naturalidadeUF}
                    onChange={handleChange}
                    maxLength={2}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="nacionalidade">Nacionalidade</Label>
                  <Input
                    type="text"
                    id="nacionalidade"
                    name="nacionalidade"
                    value={formData.nacionalidade}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="numeroRG">Nº RG</Label>
                  <Input
                    type="text"
                    id="numeroRG"
                    name="numeroRG"
                    value={formData.numeroRG}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="rgDataEmissao">RG Dt. Emissão</Label>
                  <Input
                    type="date"
                    id="rgDataEmissao"
                    name="rgDataEmissao"
                    value={formData.rgDataEmissao}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="rgOrgaoEmissor">RG Org. Emissor</Label>
                  <Input
                    type="text"
                    id="rgOrgaoEmissor"
                    name="rgOrgaoEmissor"
                    value={formData.rgOrgaoEmissor}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="escolaridade">Escolaridade</Label>
                  <Input
                    type="text"
                    id="escolaridade"
                    name="escolaridade"
                    value={formData.escolaridade}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input
                    type="text"
                    id="profissao"
                    name="profissao"
                    value={formData.profissao}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="tipoSanguineo">Tipo Sanguíneo</Label>
                  <select
                    id="tipoSanguineo"
                    name="tipoSanguineo"
                    value={formData.tipoSanguineo}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Selecione</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 4: Informações Familiares */}
                  {currentStep === 4 && (
            <section className="form-section">
              <h2 className="section-title">Informações Familiares</h2>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="nomePai">Nome Pai</Label>
                  <Input
                    type="text"
                    id="nomePai"
                    name="nomePai"
                    value={formData.nomePai}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="nomeMae">Nome Mãe</Label>
                  <Input
                    type="text"
                    id="nomeMae"
                    name="nomeMae"
                    value={formData.nomeMae}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="foiCasadoAnteriormente">Já Foi Casado Anteriormente em Igreja Evangélica?</Label>
                  <select
                    id="foiCasadoAnteriormente"
                    name="foiCasadoAnteriormente"
                    value={formData.foiCasadoAnteriormente}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="nomeConjuge">Nome Cônjuge</Label>
                  <Input
                    type="text"
                    id="nomeConjuge"
                    name="nomeConjuge"
                    value={formData.nomeConjuge}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="dataCasamento">Dt. Casamento</Label>
                  <Input
                    type="date"
                    id="dataCasamento"
                    name="dataCasamento"
                    value={formData.dataCasamento}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <Label htmlFor="quantidadeFilhos">Qt. Filhos</Label>
                  <Input
                    type="number"
                    id="quantidadeFilhos"
                    name="quantidadeFilhos"
                    value={formData.quantidadeFilhos}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="quantidadeMaiores">Qt. Maiores</Label>
                  <Input
                    type="number"
                    id="quantidadeMaiores"
                    name="quantidadeMaiores"
                    value={formData.quantidadeMaiores}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="quantidadeMenores">Qt. Menores</Label>
                  <Input
                    type="number"
                    id="quantidadeMenores"
                    name="quantidadeMenores"
                    value={formData.quantidadeMenores}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 5: Membro */}
                  {currentStep === 5 && (
            <section className="form-section">
              <h2 className="section-title">Membro</h2>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="dataBatismo">Data do Batismo</Label>
                  <Input
                    type="date"
                    id="dataBatismo"
                    name="dataBatismo"
                    value={formData.dataBatismo}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="localBatismo">Local Batismo</Label>
                  <Input
                    type="text"
                    id="localBatismo"
                    name="localBatismo"
                    value={formData.localBatismo}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="igrejaOndeFoiBatizado">Igreja Onde Foi Batizado</Label>
                  <Input
                    type="text"
                    id="igrejaOndeFoiBatizado"
                    name="igrejaOndeFoiBatizado"
                    value={formData.igrejaOndeFoiBatizado}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="dataAdmissaoMinisterial">Data Admissão Ministerial</Label>
                  <Input
                    type="date"
                    id="dataAdmissaoMinisterial"
                    name="dataAdmissaoMinisterial"
                    value={formData.dataAdmissaoMinisterial}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="tipoAdmissaoMinisterial">Tipo Admissão Ministerial</Label>
                  <Input
                    type="text"
                    id="tipoAdmissaoMinisterial"
                    name="tipoAdmissaoMinisterial"
                    value={formData.tipoAdmissaoMinisterial}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="igrejaOuMinisterioAnterior">Igreja ou Ministério Anterior</Label>
                  <Input
                    type="text"
                    id="igrejaOuMinisterioAnterior"
                    name="igrejaOuMinisterioAnterior"
                    value={formData.igrejaOuMinisterioAnterior}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 6: Consagração */}
                  {currentStep === 6 && (
            <section className="form-section">
              <h2 className="section-title">Consagração</h2>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="dataConsagracao">Data</Label>
                  <Input
                    type="date"
                    id="dataConsagracao"
                    name="dataConsagracao"
                    value={formData.dataConsagracao}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="consagracaoMinisterial">Consagração Ministerial</Label>
                  <Input
                    type="text"
                    id="consagracaoMinisterial"
                    name="consagracaoMinisterial"
                    value={formData.consagracaoMinisterial}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="localConsagracao">Local</Label>
                  <Input
                    type="text"
                    id="localConsagracao"
                    name="localConsagracao"
                    value={formData.localConsagracao}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="consagradoPor">Por</Label>
                  <Input
                    type="text"
                    id="consagradoPor"
                    name="consagradoPor"
                    value={formData.consagradoPor}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 7: Função Ministerial */}
                  {currentStep === 7 && (
            <section className="form-section">
              <h2 className="section-title">Função Ministerial</h2>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <Label htmlFor="funcao">Função</Label>
                  <Input
                    type="text"
                    id="funcao"
                    name="funcao"
                    value={formData.funcao}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="ministerioIntegracao">Ministério de Integração</Label>
                  <Input
                    type="text"
                    id="ministerioIntegracao"
                    name="ministerioIntegracao"
                    value={formData.ministerioIntegracao}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 8: Foto */}
                  {currentStep === 8 && (
            <section className="form-section">
              <h2 className="section-title">Foto</h2>
              <div className="form-row">
                <div className="form-group">
                  <Label>Foto do Membro</Label>
                  <div className="foto-perfil-wrapper">
                    <div className="foto-perfil-avatar">
                      <Avatar className="foto-avatar">
                        <AvatarImage 
                          src={fotoPreview} 
                          alt="Foto do membro"
                        />
                        <AvatarFallback>
                          {formData.nome 
                            ? formData.nome.charAt(0).toUpperCase()
                            : 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="fotoMembro" className="avatar-edit-button">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="avatar-edit-icon-button"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('fotoMembro')?.click();
                          }}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </label>
                      {fotoPreview && (
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
                        id="fotoMembro"
                        name="fotoMembro"
                        onChange={handleFotoChange}
                        accept="image/*"
                        className="foto-input-hidden"
                      />
                      <p className="foto-hint">Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
                  )}

                  {/* Etapa 9: Observações */}
                  {currentStep === 9 && (
            <section className="form-section">
              <h2 className="section-title">Observações</h2>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="observacoes">Observações</Label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Preencher com letra legível ou em formato de máquina"
                  />
                </div>
              </div>
            </section>
                  )}

                  {/* Botões de Navegação */}
                  <div className="form-actions">
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        className="nav-button"
                      >
                        <ChevronLeft className="button-icon" />
                        Anterior
                      </Button>
                    )}
                    
                    {currentStep < totalSteps - 1 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="nav-button next-button"
                      >
                        Próximo
                        <ChevronRight className="button-icon" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : 'Salvar Ficha'}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
              
              {/* Ficha Salva */}
              {fichaSalva && (
                <div className="ficha-salva-container">
                  <h3 className="ficha-salva-title">Ficha Salva</h3>
                  <div className="ficha-salva-card">
                    <div className="ficha-salva-header">
                      <div className="ficha-salva-info">
                        <h4 className="ficha-salva-nome">{fichaSalva.nome || 'Sem nome'}</h4>
                        <p className="ficha-salva-data">Salva em: {fichaSalva.dataSalvamento}</p>
                      </div>
                      {fichaSalva.foto && (
                        <div className="ficha-salva-foto">
                          <Avatar className="ficha-salva-avatar">
                            <AvatarImage src={fichaSalva.foto} alt="Foto do membro" />
                            <AvatarFallback>
                              {fichaSalva.nome ? fichaSalva.nome.charAt(0).toUpperCase() : 'M'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                    <div className="ficha-salva-details">
                      <div className="ficha-salva-detail-item">
                        <span className="detail-label">CPF:</span>
                        <span className="detail-value">{fichaSalva.cpf || 'Não informado'}</span>
                      </div>
                      <div className="ficha-salva-detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{fichaSalva.email || 'Não informado'}</span>
                      </div>
                      <div className="ficha-salva-detail-item">
                        <span className="detail-label">Telefone:</span>
                        <span className="detail-value">{fichaSalva.numeroCelular || 'Não informado'}</span>
                      </div>
                      <div className="ficha-salva-detail-item">
                        <span className="detail-label">Cidade:</span>
                        <span className="detail-value">{fichaSalva.cidade || 'Não informado'}</span>
                      </div>
                    </div>
                    <div className="ficha-salva-actions">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Carregar dados da ficha salva no formulário
                          setFormData({
                            ...fichaSalva,
                            foto: null
                          });
                          if (fichaSalva.foto) {
                            setFotoPreview(fichaSalva.foto);
                          }
                          setEditando(true);
                          setCurrentStep(0);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="ficha-edit-button"
                      >
                        <Edit className="button-icon" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default FichaMembros;
