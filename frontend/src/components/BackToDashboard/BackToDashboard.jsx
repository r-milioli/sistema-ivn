import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackToDashboard.css';

/**
 * Ícone clicável para voltar à página do Dashboard (cor pastel).
 * Deve ser colocado no início do conteúdo de cada página (dentro de dashboard-content).
 */
const BackToDashboard = () => {
  return (
    <div className="back-to-dashboard">
      <Link
        to="/dashboard"
        className="back-to-dashboard-btn"
        title="Voltar ao Dashboard"
        aria-label="Voltar ao Dashboard"
      >
        <ArrowLeft className="back-to-dashboard-icon" aria-hidden />
      </Link>
    </div>
  );
};

export default BackToDashboard;
