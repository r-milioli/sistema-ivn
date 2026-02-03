/**
 * Salvar token e dados do usuário no localStorage
 */
export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Remover dados de autenticação do localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Obter token do localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Obter dados do usuário do localStorage
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Verificar se usuário está autenticado
 */
export const isAuthenticated = () => {
  return !!getToken();
};
