import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword, resetPassword } = useAuth();

  // Se tiver token na URL, mostrar formulário de redefinição
  const isResetMode = !!token;

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }

    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess('Se o email existir, você receberá instruções para recuperar sua senha');
      setEmail('');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senha || !confirmarSenha) {
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

    const result = await resetPassword(token, senha);

    if (result.success) {
      setSuccess('Senha redefinida com sucesso! Redirecionando para login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  if (isResetMode) {
    return (
      <div className="forgot-password-container">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <Card className="forgot-password-box">
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>Digite sua nova senha abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <Label htmlFor="senha">Nova Senha</Label>
                <PasswordInput
                  id="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha de 8-16 caracteres"
                  required
                  className="forgot-password-input"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <PasswordInput
                  id="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  className="forgot-password-input"
                />
              </div>

              <Button type="submit" disabled={loading} className="submit-button w-full">
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </form>

            <div className="forgot-password-links">
              <Link to="/login">Voltar para login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <Card className="forgot-password-box">
        <CardHeader>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>
            Informe seu email e enviaremos instruções para recuperar sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Endereço de email"
                required
                className="forgot-password-input"
              />
            </div>

            <Button type="submit" disabled={loading} className="submit-button w-full">
              {loading ? 'Enviando...' : 'Enviar Instruções'}
            </Button>
          </form>

          <div className="forgot-password-links">
            <Link to="/login">Voltar para login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
