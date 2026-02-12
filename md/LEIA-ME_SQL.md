# 📋 Guia de Uso dos Arquivos SQL

## ⚠️ IMPORTANTE: Escolha o arquivo correto!

Foram criados **3 arquivos SQL** diferentes para atender diferentes necessidades:

---

## 1️⃣ `database_schema.sql` (ORIGINAL)
**Comportamento:** ❌ Vai dar ERRO se as tabelas já existirem
- Não deleta dados
- Não preserva dados (vai falhar na execução)
- Use apenas em banco de dados **completamente vazio**

---

## 2️⃣ `database_schema_safe.sql` ✅ **RECOMENDADO**
**Comportamento:** ✅ Preserva todos os dados existentes
- Usa `CREATE TABLE IF NOT EXISTS`
- Usa `CREATE INDEX IF NOT EXISTS`
- Usa `DO $$ BEGIN ... EXCEPTION` para ENUMs
- Insere ministérios apenas se não existirem
- **SEGURO para produção e desenvolvimento**

### Quando usar:
- ✅ Primeira vez criando o banco
- ✅ Banco já tem dados e você quer adicionar novas tabelas
- ✅ Ambiente de produção
- ✅ Quer garantir que nada será deletado

### Como executar:
```bash
psql -U seu_usuario -d seu_banco -f database_schema_safe.sql
```

---

## 3️⃣ `database_schema_recreate.sql` ⚠️ **CUIDADO!**
**Comportamento:** 🗑️ **DELETA TUDO** e recria do zero
- Usa `DROP TABLE IF EXISTS CASCADE`
- Usa `DROP TYPE IF EXISTS CASCADE`
- **APAGA TODOS OS DADOS EXISTENTES**
- Recria tudo do zero

### Quando usar:
- ⚠️ Ambiente de desenvolvimento/teste
- ⚠️ Quer começar do zero
- ⚠️ Backup dos dados já foi feito
- ❌ **NUNCA use em produção sem backup!**

### Como executar:
```bash
psql -U seu_usuario -d seu_banco -f database_schema_recreate.sql
```

---

## 📊 Comparação Rápida

| Característica | `database_schema.sql` | `database_schema_safe.sql` | `database_schema_recreate.sql` |
|---------------|----------------------|---------------------------|-------------------------------|
| Deleta dados? | ❌ Não | ❌ Não | ✅ **SIM** |
| Preserva dados? | ❌ Falha se existir | ✅ Sim | ❌ Não |
| Seguro para produção? | ⚠️ Só se vazio | ✅ Sim | ❌ **NÃO** |
| Quando usar | Banco vazio | Sempre | Apenas dev/teste |

---

## 🚀 Recomendação

**Use `database_schema_safe.sql`** - É a versão mais segura e funciona em qualquer situação!

---

## 📝 Notas Importantes

1. **Sempre faça backup** antes de executar qualquer SQL em produção
2. O arquivo `safe` pode ser executado múltiplas vezes sem problemas
3. O arquivo `recreate` deve ser usado com extremo cuidado
4. Todos os arquivos criam a mesma estrutura, apenas diferem na forma de criação
