import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !senha) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    const result = await login(email, senha);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <Card className="login-box">
        <CardHeader>
          <CardTitle>Bem-vindo de volta</CardTitle>
          <CardDescription>Continue com uma das seguintes opções</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Endereço de email"
                required
                className="login-input"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="senha">Senha</Label>
              <PasswordInput
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha de 8-16 caracteres"
                required
                className="login-input"
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <Checkbox id="remember" />
                <span>Lembrar-me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password-link">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="submit-button w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="login-links">
            <Link to="/register">Não tem uma conta? Cadastre-se</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
