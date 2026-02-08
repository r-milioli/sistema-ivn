# Refatoração do Sistema de Páginas

## Resumo das Mudanças

O sistema de configuração de páginas foi refatorado para oferecer maior controle e organização:

### 1. **Cards Visíveis** (Mantido)
- **`card_visivel`** (boolean): Define se o card da página aparece no dashboard
- Simples switch na tabela

### 2. **Páginas Visíveis** (Refatorado - Múltiplos Níveis)
A visibilidade da página agora é controlada por **7 níveis independentes**:

- **`pagina_visivel_geral`**: Todos os usuários autenticados
- **`pagina_visivel_visitantes`**: Apenas visitantes
- **`pagina_visivel_user`**: Usuários com `tipo_acesso = 'Usuario'`
- **`pagina_visivel_admin`**: Administradores (`tipo_acesso = 'Admin'`)
- **`pagina_visivel_superadmin`**: Super administradores (`tipo_acesso = 'SuperAdmin'`)
- **`pagina_visivel_lider_ministerio`**: Líderes do ministério vinculado à página
- **`pagina_visivel_participa_ministerio`**: Participantes do ministério vinculado à página

**Múltiplas opções podem estar marcadas**: se qualquer uma das opções marcadas corresponder ao usuário, ele verá a página.

### 3. **Tabs** (Mantido - Já estava ideal)
Sistema de permissões por tab mantido como está (Geral, Visitantes, Líder, Participante).

### 4. **Coluna Status** (Removida)
- Removida a coluna `ativo` (não funcionava corretamente)
- Simplifica a tabela e evita confusão

### 5. **Coluna Ações** (Refatorada)
- **Antes**: Botão com ícone + texto "Configurar"
- **Agora**: Dois botões com apenas ícones:
  - 👁️ **Eye**: Configurar visibilidade da página (modal)
  - ⚙️ **Cog**: Configurar tabs (modal)

---

## Estrutura da Tabela (Frontend)

| Nome | Rota | Card Visível | Ações |
|------|------|--------------|-------|
| Recepção | /recepcao | ✓ Switch | 👁️ ⚙️ |
| Finanças | /financas | ✓ Switch | 👁️ ⚙️ |
| ... | ... | ... | ... |

---

## Modais

### Modal 1: Visibilidade da Página (👁️)
Checkboxes para os 7 níveis de acesso:
- ☑️ Geral
- ☐ Visitantes
- ☐ User
- ☐ Líder do Ministério
- ☐ Participante do Ministério
- ☐ Admin
- ☐ SuperAdmin

### Modal 2: Configuração de Tabs (⚙️)
Tabela com checkboxes para cada tab:
- Geral
- Visitantes
- Líder do Ministério
- Participante do Ministério

---

## Migração do Banco de Dados

### Para quem já tem o sistema instalado:

Execute **2 scripts de migração** na ordem:

#### 1. `migracao_paginas_config_ministerio.sql`
- Adiciona `ministerio_id` à `paginas_config`
- Vincula página Recepção ao ministério "Recepção" (se existir)

#### 2. `migracao_paginas_visibilidade.sql` (NOVO)
- Adiciona as 7 colunas de visibilidade por nível
- Migra dados existentes (`pagina_visivel = true` → `pagina_visivel_geral = true`)
- Remove colunas antigas: `pagina_visivel`, `ativo`
- Cria índices para as novas colunas

```bash
# Exemplo de execução no PostgreSQL
psql -U seu_usuario -d nome_do_banco -f migracao_paginas_config_ministerio.sql
psql -U seu_usuario -d nome_do_banco -f migracao_paginas_visibilidade.sql
```

### Para novas instalações:
Use o schema atualizado `database_schema_jornada_unica.sql` que já contém todas as mudanças.

---

## Backend - Mudanças na API

### Controller: `paginasConfigController.js`

#### Endpoint de Listagem (`GET /api/paginas-config`)
**Antes:**
```json
{
  "paginas": [{
    "id": "...",
    "nome": "Recepção",
    "pagina_visivel": true,
    "card_visivel": true,
    "ativo": true
  }]
}
```

**Agora:**
```json
{
  "paginas": [{
    "id": "...",
    "nome": "Recepção",
    "ministerio_id": 1,
    "card_visivel": true,
    "pagina_visivel_geral": true,
    "pagina_visivel_visitantes": false,
    "pagina_visivel_lider_ministerio": true,
    "pagina_visivel_participa_ministerio": false,
    "pagina_visivel_user": false,
    "pagina_visivel_admin": false,
    "pagina_visivel_superadmin": false
  }]
}
```

#### Endpoint de Atualização (`PUT /api/paginas-config/:id`)
Aceita os novos campos:
```json
{
  "card_visivel": true,
  "pagina_visivel_geral": true,
  "pagina_visivel_visitantes": false,
  "pagina_visivel_lider_ministerio": true,
  "pagina_visivel_participa_ministerio": false,
  "pagina_visivel_user": false,
  "pagina_visivel_admin": false,
  "pagina_visivel_superadmin": false,
  "ministerio_id": 1
}
```

#### Endpoint de Verificação (`GET /api/paginas-config/verificar?rota=...`)
**Novo comportamento:**
- Aceita: `rota`, `pessoaId`, `tipoAcesso`, `estagioAtual`
- Retorna: `{ visivel: boolean, pagina: {...} }`
- Lógica: verifica se o usuário tem permissão baseado nas flags de visibilidade
  - **Geral**: todos veem
  - **Visitantes**: só se `estagioAtual` contém "visitante"
  - **User/Admin/SuperAdmin**: baseado em `tipoAcesso`
  - **Líder/Participante**: verifica `pessoa_ministerios` para o `ministerio_id` da página

---

## Frontend - ConfigSystem

### Arquivo: `ConfigSystem.jsx`

#### Estado do Componente `PaginasTab`:
```javascript
// Modal de Visibilidade da Página
const [modalVisibilidadeAberto, setModalVisibilidadeAberto] = useState(false);
const [paginaSelecionadaVisibilidade, setPaginaSelecionadaVisibilidade] = useState(null);

// Modal de Tabs
const [modalTabsAberto, setModalTabsAberto] = useState(false);
const [paginaSelecionadaTabs, setPaginaSelecionadaTabs] = useState(null);
```

#### Handlers Principais:
- `handleToggleCardVisivel(paginaId, newValue)`: alterna visibilidade do card
- `handleAbrirModalVisibilidade(pagina)`: abre modal de visibilidade da página
- `handleSalvarVisibilidade()`: salva as 7 flags de visibilidade
- `handleAbrirModalTabs(pagina)`: abre modal de configuração de tabs
- `handleAtualizarPermissao(tabId, campo, valor)`: atualiza permissão de uma tab

---

## Fluxo de Uso

### Configurar Visibilidade da Página:
1. Clicar no ícone **👁️ (Eye)** na linha da página
2. Marcar os níveis de acesso desejados (múltiplos)
3. Clicar em "Salvar"

### Configurar Tabs da Página:
1. Clicar no ícone **⚙️ (Cog)** na linha da página
2. Marcar as permissões para cada tab (Geral, Visitantes, Líder, Participante)
3. As mudanças são salvas automaticamente ao marcar/desmarcar

### Controlar Card no Dashboard:
1. Toggle na coluna "Card Visível"
2. Muda imediatamente (sem modal)

---

## Lógica de Acesso (OR entre opções marcadas)

Exemplo: Página com **Geral** ✓ e **Líder do Ministério** ✓ marcados:
- Usuário geral (autenticado) → **vê** (Geral)
- Líder do ministério da página → **vê** (Líder)
- Visitante → **vê** (Geral)
- Participante do ministério → **vê** (Geral)
- Líder de outro ministério → **vê** (Geral)

Exemplo: Página com apenas **Líder do Ministério** ✓ marcado:
- Usuário geral → **não vê**
- Líder do ministério da página → **vê**
- Visitante → **não vê**
- Participante do ministério → **não vê**
- Admin → **não vê** (a menos que Admin esteja marcado ou seja líder desse ministério)

---

## Benefícios da Refatoração

1. **Controle Granular**: 7 níveis de visibilidade de página (vs. apenas on/off)
2. **Clareza**: Coluna Status removida (não funcionava)
3. **Usabilidade**: Ícones sem texto = tabela mais limpa e compacta
4. **Flexibilidade**: Múltiplos níveis podem estar marcados (OR)
5. **Consistência**: Visibilidade de página alinhada com visibilidade de tabs
6. **Manutenibilidade**: Código organizado, handlers claros, modais separados

---

## Compatibilidade

- ✅ **Backward Compatible**: páginas antigas sem configuração funcionam normalmente
- ✅ **Migração Automática**: `pagina_visivel = true` → `pagina_visivel_geral = true`
- ✅ **Tabs**: sem mudanças (já funcionavam bem)
- ✅ **Dashboard**: continua usando `card_visivel`

---

## Próximos Passos (Opcionais)

1. **UI para vincular ministério**: adicionar dropdown no modal de visibilidade para escolher `ministerio_id`
2. **Mensagem de acesso negado**: página customizada quando usuário não tem permissão
3. **Auditoria**: registrar quem mudou visibilidade e quando
4. **Preset de permissões**: templates comuns (ex: "Página Pública", "Apenas Admin", "Ministério Completo")
