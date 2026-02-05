# 📊 DOCUMENTAÇÃO - SCHEMA REFATORADO DO SISTEMA IVN

## 📌 Visão Geral

O schema foi completamente reestruturado para permitir uma **jornada única e contínua** de cada pessoa no sistema, eliminando duplicação de dados e criando um histórico completo da trajetória espiritual.

---

## 🎯 Problemas Resolvidos

### ❌ Schema Antigo - Problemas

1. **Duplicação de Dados**
   - Visitante cadastrado em `visitantes`
   - Ao converter, recadastrado em `novos_convertidos`
   - Ao virar membro, recadastrado em `pessoas`
   - Ao precisar de acesso, recadastrado em `usuarios`

2. **Perda de Histórico**
   - Não era possível saber quando alguém visitou pela primeira vez
   - Histórico de mudanças de estágio perdido

3. **Inconsistência**
   - Mesma pessoa com emails diferentes em tabelas diferentes
   - Telefones desatualizados em algumas tabelas
   - Endereços divergentes

4. **Complexidade de Queries**
   - Para buscar uma pessoa completa, precisava JOINs em 4+ tabelas
   - Impossível rastrear toda a jornada de uma pessoa

### ✅ Schema Novo - Soluções

1. **Cadastro Único**
   - Uma pessoa = um registro em `pessoas`
   - Todos os dados pessoais centralizados
   - Atualizações refletem em todo o sistema

2. **Histórico Completo**
   - Tabela `jornada_espiritual` registra cada mudança
   - `visitas` registra cada comparecimento
   - Rastreamento completo da trajetória

3. **Consistência**
   - Fonte única da verdade (`pessoas`)
   - Relacionamentos mantêm integridade referencial
   - Impossível ter dados divergentes

4. **Queries Simples**
   - Dados pessoais: direto em `pessoas`
   - Histórico: JOIN simples com `jornada_espiritual`
   - Views pré-construídas para casos comuns

---

## 🏗️ Arquitetura do Schema

### 🎪 Tabela Central: `pessoas`

**Conceito:** Uma pessoa entra no sistema uma única vez e nunca sai. Seu registro evolui conforme sua jornada.

```sql
-- Exemplo: João é cadastrado como visitante
INSERT INTO pessoas (nome, sobrenome, email, telefone, estagio_atual, data_primeira_visita)
VALUES ('João', 'Silva', 'joao@email.com', '21999999999', 'Visitante', NOW());
-- ID gerado: 1

-- 2 meses depois: João se converte
-- NÃO recadastramos João!
-- Atualizamos o estágio e registramos na jornada
UPDATE pessoas SET estagio_atual = 'Novo Convertido' WHERE id = 1;

INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes)
VALUES (1, 'Visitante', 'Novo Convertido', 'Converteu-se no culto de jovens');

-- 6 meses depois: João conclui membresia e vira membro
UPDATE pessoas SET estagio_atual = 'Membro' WHERE id = 1;

INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes)
VALUES (1, 'Novo Convertido', 'Membro', 'Concluiu curso de membresia');

-- 1 ano depois: João vira líder do ministério de jovens
UPDATE pessoas SET estagio_atual = 'Líder' WHERE id = 1;

INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
VALUES (1, 2, TRUE, '2025-01-15');

-- 5 anos depois: João é ordenado Pastor
UPDATE pessoas 
SET estagio_atual = 'Obreiro', 
    cargo_eclesiastico = 'Pastor',
    data_ordenacao = '2030-03-20'
WHERE id = 1;

-- JOÃO SEMPRE FOI A PESSOA ID = 1
-- TODO O HISTÓRICO ESTÁ PRESERVADO!
```

---

## 🔄 Fluxo da Jornada Espiritual

### Estágios Disponíveis (Enum `estagio_espiritual_enum`)

```
1. Visitante              → Primeira visita
2. Visitante Frequente    → Voltou mais de uma vez
3. Novo Convertido        → Aceitou Jesus
4. Em Membresia          → Fazendo curso de membresia
5. Membro                → Concluiu membresia
6. Participante          → Participa de ministérios
7. Líder                 → Lidera ministérios
8. Obreiro               → Tem cargo eclesiástico (Pastor, Diácono, etc)
9. Inativo               → Não frequenta mais
```

### Como Registrar Mudanças de Estágio

```sql
-- Função helper para facilitar (pode ser criada)
CREATE OR REPLACE FUNCTION registrar_mudanca_estagio(
  p_pessoa_id INTEGER,
  p_novo_estagio estagio_espiritual_enum,
  p_observacoes TEXT DEFAULT NULL,
  p_registrado_por INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_estagio_atual estagio_espiritual_enum;
BEGIN
  -- Buscar estágio atual
  SELECT estagio_atual INTO v_estagio_atual 
  FROM pessoas WHERE id = p_pessoa_id;
  
  -- Inserir na jornada
  INSERT INTO jornada_espiritual 
    (pessoa_id, estagio_anterior, estagio_novo, observacoes, registrado_por)
  VALUES 
    (p_pessoa_id, v_estagio_atual, p_novo_estagio, p_observacoes, p_registrado_por);
  
  -- O trigger já atualiza automaticamente o estagio_atual em pessoas
END;
$$ LANGUAGE plpgsql;

-- Uso:
SELECT registrar_mudanca_estagio(
  1,                    -- ID da pessoa
  'Membro',            -- Novo estágio
  'Concluiu membresia', -- Observação
  5                    -- ID de quem registrou
);
```

---

## 🔐 Sistema de Acesso (Credenciais)

### Conceito de Separação

**Pessoa ≠ Usuário do Sistema**

- Nem toda pessoa precisa de login
- Visitantes, convertidos, membros comuns: sem acesso
- Apenas líderes, administradores: com acesso

### Tabela `credenciais_acesso`

```sql
-- Exemplo: Maria é membro mas não precisa logar
-- Ela só existe em 'pessoas'
INSERT INTO pessoas (nome, email, estagio_atual)
VALUES ('Maria', 'maria@email.com', 'Membro');
-- Maria NÃO tem registro em credenciais_acesso

-- Pedro é líder e precisa de acesso ao sistema
INSERT INTO pessoas (nome, email, estagio_atual)
VALUES ('Pedro', 'pedro@email.com', 'Líder');
-- ID gerado: 10

-- Criar credenciais para Pedro
INSERT INTO credenciais_acesso (pessoa_id, senha_hash, tipo_acesso)
VALUES (10, '$2a$10$...', 'Lider');

-- Pedro pode logar, Maria não pode
```

### Tipos de Acesso

```sql
'Sem Acesso'   → Apenas cadastrado (padrão para todos)
'Usuario'      → Acesso básico ao sistema
'Lider'        → Líder de ministério (vê seu ministério)
'Admin'        → Administrador (vê tudo, edita tudo)
'SuperAdmin'   → Super administrador (+ gerencia admins)
```

---

## 📊 Tabelas de Relacionamento

### `visitas` - Registro de Visitas

Cada vez que uma pessoa vem à igreja, registra-se uma visita.

```sql
-- João veio pela primeira vez
INSERT INTO visitas (pessoa_id, data_visita, recepcionado_por, pedido_oracao)
VALUES (1, '2025-01-10 19:00:00', 5, 'Oração pela família');

-- João voltou 2 semanas depois
INSERT INTO visitas (pessoa_id, data_visita, recepcionado_por)
VALUES (1, '2025-01-24 19:00:00', 5);

-- João voltou de novo
INSERT INTO visitas (pessoa_id, data_visita, recepcionado_por)
VALUES (1, '2025-02-07 19:00:00', 7);

-- Agora sabemos:
-- - João visitou 3 vezes
-- - Primeira visita: 10/01/2025
-- - Última visita: 07/02/2025
-- - Frequência: aproximadamente quinzenal
```

### `conversoes` - Registro de Conversão

Quando alguém aceita Jesus, registra-se aqui.

```sql
-- João se converteu
INSERT INTO conversoes (
  pessoa_id, 
  data_conversao, 
  local_conversao, 
  acompanhado_por,
  testemunho
)
VALUES (
  1,
  '2025-02-07 20:30:00',
  'Culto de Jovens',
  8,
  'Me sentia vazio, mas encontrei propósito em Jesus'
);

-- Mudança de estágio
SELECT registrar_mudanca_estagio(1, 'Novo Convertido', 'Converteu-se no culto de jovens', 8);
```

### `pessoa_ministerios` - Participação em Ministérios

Relaciona pessoas com ministérios (líder ou participante).

```sql
-- João entra no ministério de jovens como participante
INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
VALUES (1, 2, FALSE, '2025-03-01'); -- ministerio_id 2 = Jovens

-- 1 ano depois, João vira líder
INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
VALUES (1, 2, TRUE, '2026-03-01');

-- Ana participa de 3 ministérios
INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
VALUES 
  (2, 1, FALSE, '2025-01-01'), -- Louvor
  (2, 4, FALSE, '2025-01-01'), -- Intercessão
  (2, 5, TRUE, '2025-06-01');  -- Recepção (líder)
```

### `matriculas_membresia` + `aulas_membresia` - Curso de Membresia

```sql
-- João se matricula na membresia
INSERT INTO matriculas_membresia (pessoa_id, data_matricula)
VALUES (1, '2025-02-15');
-- ID gerado: 100

-- Criar as 5 aulas (inicialmente não concluídas)
INSERT INTO aulas_membresia (matricula_id, aula_numero)
VALUES 
  (100, 1),
  (100, 2),
  (100, 3),
  (100, 4),
  (100, 5);

-- João conclui a aula 1
UPDATE aulas_membresia 
SET concluida = TRUE, data_conclusao = '2025-02-22'
WHERE matricula_id = 100 AND aula_numero = 1;

-- João conclui a aula 2
UPDATE aulas_membresia 
SET concluida = TRUE, data_conclusao = '2025-03-01'
WHERE matricula_id = 100 AND aula_numero = 2;

-- ... conclui todas as 5 aulas

-- Quando a 5ª aula for concluída, o TRIGGER automático marca:
-- matriculas_membresia.concluido = TRUE
-- matriculas_membresia.data_conclusao = data atual
```

---

## 🎯 Views Úteis

### `vw_pessoas_resumo` - Visão Geral de Pessoas

```sql
-- Ver todas as pessoas com resumo
SELECT * FROM vw_pessoas_resumo;

-- Exemplo de resultado:
id | nome_completo    | email           | estagio_atual    | tem_acesso_sistema | total_visitas | ultima_visita
1  | João Silva       | joao@email.com  | Líder            | true               | 15            | 2025-02-01
2  | Maria Santos     | maria@email.com | Membro           | false              | 8             | 2025-01-28
3  | Pedro Costa      | pedro@email.com | Visitante        | false              | 1             | 2025-01-15
```

### `vw_jornada_completa` - Histórico da Jornada

```sql
-- Ver toda a jornada de João (id = 1)
SELECT * FROM vw_jornada_completa WHERE pessoa_id = 1 ORDER BY data_mudanca;

-- Resultado:
pessoa_id | nome_completo | estagio_anterior    | estagio_novo        | data_mudanca        | observacoes
1         | João Silva    | NULL                | Visitante           | 2025-01-10 19:00:00 | Primeira visita
1         | João Silva    | Visitante           | Novo Convertido     | 2025-02-07 20:30:00 | Converteu-se no culto
1         | João Silva    | Novo Convertido     | Em Membresia        | 2025-02-15 10:00:00 | Iniciou membresia
1         | João Silva    | Em Membresia        | Membro              | 2025-04-01 14:00:00 | Concluiu membresia
1         | João Silva    | Membro              | Líder               | 2026-03-01 10:00:00 | Assumiu liderança jovens
```

### `vw_ministerios_equipe` - Equipes de Ministérios

```sql
-- Ver equipe do ministério de Jovens
SELECT * FROM vw_ministerios_equipe WHERE ministerio_nome = 'Jovens';

-- Resultado:
ministerio_nome | pessoa_nome   | e_lider | status | data_inicio
Jovens          | João Silva    | true    | Ativo  | 2026-03-01
Jovens          | Ana Costa     | false   | Ativo  | 2025-06-15
Jovens          | Carlos Lima   | false   | Ativo  | 2025-08-01
```

### `vw_progresso_membresia` - Acompanhamento de Membresia

```sql
-- Ver progresso de todos os alunos
SELECT * FROM vw_progresso_membresia WHERE concluido = FALSE;

-- Resultado:
nome_completo | aulas_concluidas | aulas_pendentes | progresso_percentual | data_matricula
João Silva    | 3                | 2               | 60.00                | 2025-02-15
Maria Santos  | 5                | 0               | 100.00               | 2025-01-10
Pedro Costa   | 1                | 4               | 20.00                | 2025-01-20
```

### `vw_relatorio_financeiro` - Consolidado Financeiro

```sql
-- Ver todas as transações do mês atual
SELECT * FROM vw_relatorio_financeiro 
WHERE EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY data DESC;
```

### `vw_estatisticas_gerais` - Dashboard Geral

```sql
-- Ver estatísticas gerais
SELECT * FROM vw_estatisticas_gerais;

-- Resultado:
total_pessoas_ativas | total_visitantes | total_membros | total_lideres | entradas_mes_atual | saidas_mes_atual
250                  | 15               | 180           | 25            | 45000.00           | 12000.00
```

---

## 🚀 Casos de Uso Práticos

### 1. Cadastrar um Novo Visitante

```sql
-- Na recepção, chega um novo visitante
INSERT INTO pessoas (
  nome, sobrenome, telefone, email, bairro, cidade,
  estagio_atual, data_primeira_visita, como_conheceu
)
VALUES (
  'Carlos', 'Oliveira', '21988888888', 'carlos@email.com',
  'Centro', 'Iguaba Grande',
  'Visitante', NOW(), 'redesocial'
)
RETURNING id;
-- Retorna: 50

-- Registrar a visita
INSERT INTO visitas (pessoa_id, data_visita, recepcionado_por, pedido_oracao)
VALUES (50, NOW(), 5, 'Precisa de oração pelo emprego');

-- Registrar na jornada
INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes)
VALUES (50, NULL, 'Visitante', 'Primeira visita - conheceu pela internet');
```

### 2. Converter um Visitante

```sql
-- Carlos voltou e se converteu!
-- Registrar conversão
INSERT INTO conversoes (
  pessoa_id, data_conversao, local_conversao, 
  acompanhado_por, testemunho
)
VALUES (
  50, NOW(), 'Culto de Domingo',
  8, 'Estava desempregado e sem esperança, Jesus mudou minha vida'
);

-- Mudar estágio
SELECT registrar_mudanca_estagio(
  50, 'Novo Convertido', 
  'Aceitou Jesus no culto de domingo', 
  8
);
```

### 3. Matricular na Membresia

```sql
-- Carlos quer fazer membresia
INSERT INTO matriculas_membresia (pessoa_id, data_matricula)
VALUES (50, CURRENT_DATE)
RETURNING id;
-- Retorna: 200

-- Criar as 5 aulas
INSERT INTO aulas_membresia (matricula_id, aula_numero)
SELECT 200, aula FROM generate_series(1, 5) aula;

-- Mudar estágio
SELECT registrar_mudanca_estagio(
  50, 'Em Membresia', 
  'Iniciou curso de membresia', 
  NULL
);
```

### 4. Concluir Membresia e Virar Membro

```sql
-- Marcar todas as aulas como concluídas
UPDATE aulas_membresia 
SET concluida = TRUE, data_conclusao = CURRENT_DATE
WHERE matricula_id = 200;

-- O trigger automaticamente marca:
-- matriculas_membresia.concluido = TRUE

-- Mudar estágio para Membro
SELECT registrar_mudanca_estagio(
  50, 'Membro', 
  'Concluiu curso de membresia', 
  NULL
);
```

### 5. Adicionar a um Ministério

```sql
-- Carlos entra no ministério de Mídia
INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
VALUES (50, 6, FALSE, CURRENT_DATE); -- 6 = Mídia

-- Mudar estágio para Participante
SELECT registrar_mudanca_estagio(
  50, 'Participante', 
  'Começou a participar do ministério de Mídia', 
  NULL
);
```

### 6. Promover a Líder

```sql
-- 1 ano depois, Carlos vira líder do ministério de Mídia
INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
VALUES (50, 6, TRUE, CURRENT_DATE);

-- Mudar estágio para Líder
SELECT registrar_mudanca_estagio(
  50, 'Líder', 
  'Assumiu liderança do ministério de Mídia', 
  NULL
);

-- Dar acesso ao sistema como Líder
INSERT INTO credenciais_acesso (pessoa_id, senha_hash, tipo_acesso)
VALUES (50, '$2a$10$hashedpassword', 'Lider');
```

### 7. Ordenar como Obreiro (Pastor/Diácono)

```sql
-- Carlos é ordenado Diácono
UPDATE pessoas 
SET 
  estagio_atual = 'Obreiro',
  cargo_eclesiastico = 'Diácono',
  data_ordenacao = CURRENT_DATE
WHERE id = 50;

-- Registrar na jornada
INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes)
VALUES (50, 'Líder', 'Obreiro', 'Ordenado ao cargo de Diácono');

-- Atualizar acesso para Admin
UPDATE credenciais_acesso 
SET tipo_acesso = 'Admin'
WHERE pessoa_id = 50;
```

---

## 📈 Queries Úteis

### Buscar Pessoas por Estágio

```sql
-- Todos os visitantes
SELECT * FROM vw_pessoas_resumo WHERE estagio_atual = 'Visitante';

-- Todos os membros
SELECT * FROM vw_pessoas_resumo WHERE estagio_atual = 'Membro';

-- Todos os líderes
SELECT * FROM vw_pessoas_resumo WHERE estagio_atual = 'Líder';
```

### Buscar Pessoas que Precisam Atenção

```sql
-- Visitantes que não voltam há mais de 1 mês
SELECT 
  nome_completo, email, telefone, ultima_visita
FROM vw_pessoas_resumo 
WHERE estagio_atual = 'Visitante'
  AND ultima_visita < CURRENT_DATE - INTERVAL '30 days';

-- Pessoas em membresia há mais de 2 meses e não concluíram
SELECT 
  p.nome_completo, 
  mm.data_matricula,
  pm.aulas_concluidas,
  pm.progresso_percentual
FROM vw_progresso_membresia pm
JOIN vw_pessoas_resumo p ON pm.pessoa_id = p.id
WHERE pm.concluido = FALSE
  AND mm.data_matricula < CURRENT_DATE - INTERVAL '60 days';
```

### Relatórios de Crescimento

```sql
-- Conversões por mês (últimos 12 meses)
SELECT 
  TO_CHAR(data_conversao, 'YYYY-MM') as mes,
  COUNT(*) as total_conversoes
FROM conversoes
WHERE data_conversao >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(data_conversao, 'YYYY-MM')
ORDER BY mes;

-- Novos membros por mês
SELECT 
  TO_CHAR(data_mudanca, 'YYYY-MM') as mes,
  COUNT(*) as novos_membros
FROM jornada_espiritual
WHERE estagio_novo = 'Membro'
  AND data_mudanca >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(data_mudanca, 'YYYY-MM')
ORDER BY mes;
```

### Engajamento em Ministérios

```sql
-- Pessoas ativas em mais de um ministério
SELECT 
  p.nome_completo,
  COUNT(pm.id) as total_ministerios,
  string_agg(m.nome, ', ') as ministerios
FROM pessoas p
JOIN pessoa_ministerios pm ON p.id = pm.pessoa_id
JOIN ministerios m ON pm.ministerio_id = m.id
WHERE pm.data_fim IS NULL
GROUP BY p.id, p.nome_completo
HAVING COUNT(pm.id) > 1
ORDER BY total_ministerios DESC;
```

---

## ⚠️ Regras Importantes

### ✅ SEMPRE Fazer

1. **Cadastrar visitante em `pessoas`** - nunca em uma tabela separada
2. **Registrar mudanças de estágio em `jornada_espiritual`**
3. **Registrar cada visita em `visitas`**
4. **Usar as views** para consultas comuns
5. **Verificar se pessoa existe** antes de cadastrar (evitar duplicatas)

### ❌ NUNCA Fazer

1. **Deletar registros de `pessoas`** - marcar como `ativo = FALSE`
2. **Atualizar `estagio_atual` sem registrar em `jornada_espiritual`**
3. **Criar credenciais sem necessidade** - maioria não precisa de acesso
4. **Duplicar pessoas** - validar CPF/email antes de inserir

---

## 🔄 Migração do Schema Antigo

Se você já tem dados no schema antigo, será necessário um script de migração. 

### Principais Passos da Migração:

1. **Consolidar todas as pessoas**
   - `visitantes` → `pessoas` (estagio_atual = 'Visitante')
   - `novos_convertidos` → `pessoas` (estagio_atual = 'Novo Convertido')
   - `pessoas` antigas → `pessoas` novas (estagio_atual = 'Membro')
   - `usuarios` → `pessoas` + `credenciais_acesso`

2. **Criar histórico de jornada**
   - Inferir mudanças de estágio baseado em datas
   - Registrar em `jornada_espiritual`

3. **Migrar relacionamentos**
   - `pessoa_ministerios_lider` + `pessoa_ministerios_participante` → `pessoa_ministerios`
   - `pessoa_estagios` → não precisa mais (estágio é único)
   - `alunos_membresia` → `matriculas_membresia`

Posso criar um script de migração se necessário!

---

## 🎓 Resumo dos Benefícios

### ✨ Vantagens do Novo Schema

| Aspecto | Schema Antigo | Schema Novo |
|---------|---------------|-------------|
| **Cadastros** | 1 pessoa = 4 registros | 1 pessoa = 1 registro |
| **Histórico** | ❌ Perdido | ✅ Completo |
| **Consistência** | ⚠️ Dados divergentes | ✅ Fonte única |
| **Queries** | 🐌 Complexas (JOINs) | ⚡ Simples (direto) |
| **Manutenção** | 😰 Difícil | 😊 Fácil |
| **Escalabilidade** | ⚠️ Limitada | ✅ Excelente |

### 🎯 Casos de Uso Atendidos

✅ Visitante vira membro vira líder vira pastor - **MESMO ID**  
✅ Ver toda a jornada de uma pessoa em uma query  
✅ Rastrear quando alguém parou de frequentar  
✅ Saber quantas vezes cada pessoa visitou  
✅ Dashboard de estatísticas em tempo real  
✅ Relatórios de crescimento e engajamento  
✅ Gestão de acesso ao sistema separada de gestão de pessoas  

---

## 📞 Suporte

Para dúvidas sobre o schema:

1. Consulte as **views** - elas têm exemplos práticos
2. Veja os **comentários nas tabelas** - explicam cada campo
3. Use os **triggers** - eles automatizam tarefas comuns

---

**Sistema IVN - Schema Refatorado v2.0**  
*Uma jornada, um cadastro, histórico completo* 🚀