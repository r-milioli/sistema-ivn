import React from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { UserPlus, List } from 'lucide-react';
import './Recepcao.css';

const Recepcao = () => {
  return (
    <MainLayout>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Recepção</h1>
          
          <Tabs defaultValue="visitante" className="recepcao-tabs">
            <TabsList className="recepcao-tabs-list">
              <TabsTrigger value="visitante" className="recepcao-tabs-trigger">
                <UserPlus className="tab-icon" />
                <span>Visitante</span>
              </TabsTrigger>
              <TabsTrigger value="listar" className="recepcao-tabs-trigger">
                <List className="tab-icon" />
                <span>Listar Visitantes</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="visitante" className="recepcao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Cadastrar Visitante</h2>
                <p>Formulário de cadastro de visitante será adicionado aqui.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="listar" className="recepcao-tabs-content">
              <div className="tab-content-wrapper">
                <h2>Lista de Visitantes</h2>
                <p>Tabela com lista de visitantes será adicionada aqui.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
};

export default Recepcao;
