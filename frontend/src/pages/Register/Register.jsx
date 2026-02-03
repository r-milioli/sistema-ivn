import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import './Register.css';

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!nome || !email || !senha || !confirmarSenha) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    const result = await register(nome, email, senha);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <Card className="register-box">
        <CardHeader>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>Preencha os dados abaixo para criar sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                required
                className="register-input"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Endereço de email"
                required
                className="register-input"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="senha">Senha</Label>
              <Input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha de 8-16 caracteres"
                required
                className="register-input"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <Input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua senha"
                required
                className="register-input"
              />
            </div>

            <Button type="submit" disabled={loading} className="submit-button w-full">
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <div className="register-links">
            <Link to="/login">Já tem uma conta? Faça login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
