# Análise: Refatoração do Backend para o Schema Jornada Única

## Conclusão

**Sim, é possível refatorar o backend para o novo schema da jornada única.** O novo modelo é mais coerente e exige mudanças bem delimitadas: troca de tabelas/colunas e adaptação da autenticação para pessoa + credenciais. Abaixo está o mapeamento e o que alterar em cada módulo.

---

## 1. Visão geral das mudanças

| Área | Schema atual | Schema jornada única | Impacto no backend |
|------|--------------|----------------------|--------------------|
| **Autenticação** | `usuarios` (id, nome, email, senha_hash) | `pessoas` + `credenciais_acesso` (pessoa_id, senha_hash, tipo_acesso) | Alto – login e JWT passam a usar pessoa |
| **Visitantes** | Tabela `visitantes` | `pessoas` + `visitas` + `jornada_espiritual` | Alto – fluxo vira “criar pessoa + registrar visita” |
| **Pessoas** | `pessoas` (sem estágio/jornada) | `pessoas` (estagio_atual, data_primeira_visita, etc.) | Médio – novos campos e filtros |
| **Atribuições** | `atribuicoes`, `pessoa_estagios`, `pessoa_ministerios_lider`, `pessoa_ministerios_participante` | Estágio em `pessoas` + `jornada_espiritual`; ministérios em `pessoa_ministerios` (e_lider) | Alto – lógica unificada |
| **Finanças (entradas)** | `entrada_autores` (usuario_id) | `entrada_doadores` (pessoa_id, valor_individual) | Médio – autores viram doadores (pessoa_id) |
| **Finanças (geral)** | `criado_por` = usuario_id | `registrado_por` = pessoa_id | Baixo – troca de coluna e origem do id |
| **Relatórios** | `criado_por` → usuarios | `criado_por` → pessoas(id) | Baixo – mesmo nome, outra FK |
| **Saídas** | `criado_por` → usuarios | `registrado_por` → pessoas(id) | Baixo – troca de coluna e id |

---

## 2. Módulo a módulo

### 2.1 Autenticação (`authController.js` + `authMiddleware.js`)

**Situação atual**

- Tudo em `usuarios`: registro, login, recuperação de senha.
- JWT guarda `id` e `email` do usuário (usuarios.id).
- Middleware carrega usuário por `usuarios.id`.

**No schema novo**

- Pessoa em `pessoas` (nome, email, etc.).
- Acesso em `credenciais_acesso` (pessoa_id, senha_hash, tipo_acesso, token_recuperacao, etc.).
- Quem “loga” é uma **pessoa** que tem credenciais.

**Refatoração sugerida**

1. **Registro**
   - Verificar se já existe pessoa com aquele email em `pessoas`.
   - Se não existir: criar em `pessoas` e depois em `credenciais_acesso` (senha_hash, tipo_acesso padrão).
   - Se existir: só criar/atualizar em `credenciais_acesso` (evitar duplicar pessoa).
2. **Login**
   - Buscar pessoa por email em `pessoas`.
   - Buscar em `credenciais_acesso` por `pessoa_id`.
   - Comparar senha com `credenciais_acesso.senha_hash`.
   - JWT passar a carregar **pessoa_id** (e opcionalmente email), para manter compatibilidade com “quem fez a ação”.
3. **Middleware**
   - Decodificar JWT → obter pessoa_id.
   - Carregar pessoa em `pessoas` e, se precisar, tipo em `credenciais_acesso`.
   - Definir `req.user = { id: pessoa_id, nome, email, tipoAcesso }` (id = pessoa_id em todo o backend).
4. **Recuperação de senha**
   - Buscar pessoa por email; atualizar `credenciais_acesso` (token_recuperacao, token_recuperacao_expira).

Assim, todo o resto do backend continua usando `req.user.id` como “quem está logado”, mas esse id será **pessoa_id**, compatível com as FKs do schema novo.

---

### 2.2 Visitantes (`visitantesController.js`)

**Situação atual**

- INSERT em `visitantes` (recepcionado_por, dia_visita, nome_completo, data_nascimento, whatsapp, email, bairro, cidade, como_conheceu, pedido_oracao).
- `recepcionado_por` é usuario_id.
- Listagem/estatísticas usam `visitantes` + JOIN com `usuarios`.

**No schema novo**

- Não existe tabela `visitantes`.
- Cadastro de “visitante” = criar/identificar **pessoa** + registrar **visita** + opcionalmente **jornada_espiritual**.

**Refatoração sugerida**

1. **Cadastrar visitante**
   - Verificar se já existe pessoa com mesmo email/telefone em `pessoas`.
   - Se não: INSERT em `pessoas` (nome, sobrenome, data_nascimento, telefone/whatsapp, email, bairro, cidade, estado, estagio_atual = 'Visitante', data_primeira_visita, como_conheceu).
   - Se sim: usar esse pessoa_id.
   - INSERT em `visitas` (pessoa_id, data_visita, recepcionado_por = req.user.id como pessoa_id, pedido_oracao, observacoes).
   - Opcional: INSERT em `jornada_espiritual` (pessoa_id, estagio_anterior = NULL, estagio_novo = 'Visitante', observacoes).
   - Recepcionado por: no schema novo é `pessoas(id)`; usar `req.user.id` (já como pessoa_id).
2. **Listar “visitantes”**
   - Listar pessoas com `estagio_atual = 'Visitante'` (e eventualmente 'Visitante Frequente') usando `pessoas` + `visitas`.
   - JOIN de `visitas.recepcionado_por` com `pessoas` para nome de quem recepcionou.
3. **Estatísticas**
   - Baseadas em `pessoas` (estagio_atual) e em `visitas` (datas, contagens).
4. **Obter por ID**
   - Retornar pessoa + últimas visitas (e dados de jornada se necessário).

Campos do front (nomeCompleto, dataNascimento, whatsapp, email, bairro, cidade, comoConheceu, pedidoOracao, recepcionadoPor, diaVisita) continuam sendo enviados; o backend só passa a gravar em `pessoas` + `visitas` (+ `jornada_espiritual`).

---

### 2.3 Pessoas (`pessoasController.js`)

**Situação atual**

- INSERT/UPDATE em `pessoas` com: nome, sobrenome, sexo, estado_civil, data_nascimento, telefone, email, cep, rua, numero, complemento, bairro, cidade, estado.
- Sem estágio, cargo ou jornada.

**No schema novo**

- `pessoas` ganha: estagio_atual, data_primeira_visita, como_conheceu, cargo_eclesiastico, data_ordenacao, ativo, foto_perfil, whatsapp, estado (enum estado_brasil_enum).

**Refatoração sugerida**

- Incluir no INSERT/UPDATE os novos campos (estagio_atual, data_primeira_visita, como_conheceu, cargo_eclesiastico, data_ordenacao, ativo, whatsapp, etc.).
- Listagem e busca: adicionar filtros por estagio_atual quando fizer sentido.
- Manter compatibilidade com o que o front já envia (ex.: estado_civil, sexo) e mapear para os enums do schema.

---

### 2.4 Atribuições (`atribuicoesController.js`)

**Situação atual**

- Tabelas: `atribuicoes` (cargo_eclesiastico, tipo_usuario), `pessoa_estagios`, `pessoa_ministerios_lider`, `pessoa_ministerios_participante`.
- Múltiplos estágios por pessoa; ministérios separados em líder vs participante.

**No schema novo**

- Um único estágio por pessoa: `pessoas.estagio_atual` + histórico em `jornada_espiritual`.
- Cargo em `pessoas`: cargo_eclesiastico, data_ordenacao.
- Acesso ao sistema: `credenciais_acesso.tipo_acesso` (por pessoa_id).
- Ministérios: uma única tabela `pessoa_ministerios` (pessoa_id, ministerio_id, e_lider, data_inicio, data_fim).

**Refatoração sugerida**

1. **Salvar atribuições**
   - Atualizar `pessoas`: cargo_eclesiastico, data_ordenacao, estagio_atual (um só).
   - Se a pessoa passar a ter acesso: INSERT/UPDATE em `credenciais_acesso` (senha_hash, tipo_acesso).
   - Registrar mudança de estágio em `jornada_espiritual` (estagio_anterior, estagio_novo, registrado_por = req.user.id).
   - Ministérios: deletar inserções antigas em `pessoa_ministerios` para a pessoa e reinserir com (pessoa_id, ministerio_id, e_lider, data_inicio, data_fim).
2. **Ler atribuições**
   - Cargo e estágio: direto de `pessoas` (e histórico em `jornada_espiritual` se precisar).
   - Tipo de acesso: de `credenciais_acesso`.
   - Ministérios: um único SELECT em `pessoa_ministerios` (e_lider = true/false para separar líder vs participante na resposta ao front).

Ajustar enums: no schema novo, estágios são os do `estagio_espiritual_enum` (ex.: 'Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Membresia', 'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'); tipo de acesso é `tipo_acesso_enum` ('Sem Acesso', 'Usuario', 'Lider', 'Admin', 'SuperAdmin').

---

### 2.5 Entradas financeiras (`entradasFinanceirasController.js`)

**Situação atual**

- `entradas_financeiras` com `criado_por` (usuario_id).
- `entrada_autores` (entrada_id, usuario_id).

**No schema novo**

- `entradas_financeiras.registrado_por` → pessoas(id).
- `entrada_doadores` (entrada_id, pessoa_id, valor_individual opcional).

**Refatoração sugerida**

- Trocar `criado_por` por `registrado_por` e usar `req.user.id` (pessoa_id).
- Trocar tabela `entrada_autores` por `entrada_doadores`: validar e inserir pessoa_id (e opcionalmente valor_individual).
- Validação de “autores”: passar a validar pessoa_id em `pessoas` (em vez de usuarios).
- Listagens e relatórios: JOIN com `entrada_doadores` + `pessoas` para nomes dos doadores.

---

### 2.6 Finanças – relatório consolidado (`financasController.js`)

**Situação atual**

- View/query usa `entrada_autores` e `usuarios` para nomes.

**No schema novo**

- View `vw_relatorio_financeiro` já usa `entrada_doadores` e `pessoas`.
- Se a query for feita no controller: trocar JOIN de entrada_autores/usuarios para entrada_doadores/pessoas e usar `registrado_por` como pessoa_id.

---

### 2.7 Saídas financeiras (`saidasFinanceirasController.js`)

**Situação atual**

- `criado_por` (usuario_id).

**No schema novo**

- `registrado_por` → pessoas(id).

**Refatoração sugerida**

- Renomear uso de `criado_por` para `registrado_por` nas queries.
- Garantir que `req.user.id` seja pessoa_id (já garantido pelo novo auth).

---

### 2.8 Relatórios (`relatoriosController.js`)

**Situação atual**

- `criado_por` → usuarios.

**No schema novo**

- `criado_por` → pessoas(id).

**Refatoração sugerida**

- Manter coluna `criado_por`; apenas passar a gravar e comparar com pessoa_id (req.user.id).
- JOIN para “nome de quem criou”: usar `pessoas` em vez de `usuarios`.

---

## 3. Resumo de alterações por arquivo

| Arquivo | Alterações principais |
|---------|------------------------|
| `authController.js` | Registro/login/recuperação usando `pessoas` + `credenciais_acesso`; JWT com pessoa_id |
| `authMiddleware.js` | Resolver usuário por pessoa_id (pessoas + credenciais_acesso); definir req.user.id = pessoa_id |
| `visitantesController.js` | Cadastro em pessoas + visitas (+ jornada_espiritual); listagem/estatísticas por pessoas e visitas |
| `pessoasController.js` | Incluir novos campos de pessoas (estagio_atual, data_primeira_visita, etc.) e filtros |
| `atribuicoesController.js` | Usar pessoas (estagio_atual, cargo), credenciais_acesso (tipo_acesso), jornada_espiritual, pessoa_ministerios |
| `entradasFinanceirasController.js` | registrado_por (pessoa_id); entrada_doadores (pessoa_id); validar pessoas |
| `financasController.js` | Relatório usando entrada_doadores + pessoas e registrado_por como pessoa_id |
| `saidasFinanceirasController.js` | criado_por → registrado_por (pessoa_id) |
| `relatoriosController.js` | criado_por como pessoa_id; JOIN com pessoas para nome |

---

## 4. Pontos de atenção no schema SQL

1. **View `vw_relatorio_financeiro`**  
   No PostgreSQL, VIEW não pode ter `ORDER BY` na definição (é ignorado ou gera erro conforme a versão). Melhor remover o `ORDER BY criado_em DESC` da view e ordenar na query do backend.

2. **Triggers**  
   Uso de `EXECUTE FUNCTION` está correto para PostgreSQL 11+.

3. **Migração de dados**  
   Se já existir ambiente com schema antigo, será necessário script de migração (documentação_jornada_unica.md já descreve os passos gerais: consolidar visitantes/novos_convertidos/pessoas/usuarios em `pessoas` + `credenciais_acesso`, migrar relacionamentos e criar histórico em `jornada_espiritual`).

---

## 5. Ordem sugerida para o refactor

1. **Auth** – alterar login/registro/middleware para pessoa + credenciais e JWT com pessoa_id (garantir que req.user.id seja sempre pessoa_id).
2. **Pessoas** – ajustar INSERT/UPDATE e listagens para os novos campos e enums.
3. **Visitantes** – reescrever fluxo para pessoas + visitas + jornada_espiritual.
4. **Atribuições** – unificar em pessoas, credenciais_acesso, jornada_espiritual e pessoa_ministerios.
5. **Finanças (entradas)** – entrada_doadores e registrado_por.
6. **Finanças (relatório)** e **Saídas** e **Relatórios** – trocar usuario_id por pessoa_id onde for criado_por/registrado_por.

Com isso, o backend fica alinhado ao schema da jornada única e continua atendendo às mesmas funcionalidades de forma mais consistente e fácil de evoluir.
