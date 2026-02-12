import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Token de redefinição não fornecido');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token inválido');
      return;
    }

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
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="reset-password-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <Card className="reset-password-box">
        <CardHeader>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <Label htmlFor="senha">Nova Senha</Label>
              <Input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength="6"
                className="reset-password-input"
                disabled={!token}
              />
            </div>

            <div className="form-group">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                minLength="6"
                className="reset-password-input"
                disabled={!token}
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !token}
              className="submit-button w-full"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </form>

          <div className="reset-password-links">
            <Link to="/login">Voltar para login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
