import React, { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { BarChart3, Users } from 'lucide-react';
import './Financas.css';

const Financas = () => {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    sexo: '',
    estadoCivil: '',
    dataNascimento: '',
    telefone: '',
    email: '',
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
      // Simulação de sucesso
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Pessoa cadastrada com sucesso!' });
        setFormData({
          nome: '',
          sobrenome: '',
          sexo: '',
          estadoCivil: '',
          dataNascimento: '',
          telefone: '',
          email: '',
          cep: '',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao cadastrar pessoa. Tente novamente.' });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Finanças</h1>
          
          <Tabs defaultValue="gestao-pessoas" className="financas-tabs">
            <TabsList className="financas-tabs-list">
              <TabsTrigger value="gestao-pessoas" className="financas-tabs-trigger">
                <Users className="tab-icon" />
                <span>Gestão de Pessoas</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="financas-tabs-trigger">
                <BarChart3 className="tab-icon" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="gestao-pessoas" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Cadastrar Pessoa</h2>
                
                <form onSubmit={handleSubmit} className="pessoa-form">
                  {message.text && (
                    <div className={`form-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

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
                        placeholder="Digite o sobrenome completo"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <Label htmlFor="sexo">Sexo</Label>
                      <select
                        id="sexo"
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o sexo</option>
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
                        required
                        className="form-select"
                      >
                        <option value="">Selecione o estado civil</option>
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
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        type="date"
                        id="dataNascimento"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
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

                  <div className="form-row">
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
                        required
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
                        required
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
                        required
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
                        placeholder="Digite a cidade"
                        required
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
                        required
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
                      {loading ? 'Cadastrando...' : 'Cadastrar Pessoa'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="financas-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Analytics</h2>
                <p>Conteúdo de analytics será adicionado aqui.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default Financas;
