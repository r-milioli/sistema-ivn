# Análise Completa dos Formulários do Sistema

## 1. AUTENTICAÇÃO E PERFIL

### Login
- email (string, obrigatório)
- senha (string, obrigatório)
- lembrar-me (boolean, opcional)

### Registro
- nome (string, obrigatório)
- email (string, obrigatório, único)
- senha (string, obrigatório, mínimo 6 caracteres)
- confirmarSenha (string, obrigatório)

### Recuperação de Senha
- email (string, obrigatório)
- token (string, para reset)
- senha (string, obrigatório, mínimo 6 caracteres)
- confirmarSenha (string, obrigatório)

### Configurações - Perfil
- fotoPerfil (arquivo imagem, opcional, máximo 5MB)
- nome (string, obrigatório)
- sobrenome (string, obrigatório)
- email (string, obrigatório)
- telefone (string, obrigatório)
- dataNascimento (date, opcional)
- sexo (enum: masculino, feminino, outro, nao-informar, opcional)
- estadoCivil (enum: solteiro, casado, divorciado, viuvo, uniao-estavel, opcional)
- cep (string, opcional)
- rua (string, opcional)
- numero (string, opcional)
- complemento (string, opcional)
- bairro (string, opcional)
- cidade (string, opcional)
- estado (enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO, opcional)

### Configurações - Sistema
- email (string, obrigatório)
- senhaAtual (string, opcional)
- novaSenha (string, opcional, mínimo 6 caracteres)
- confirmarSenha (string, opcional)

## 2. RECEPÇÃO

### Cadastro de Visitante
- recepcionadoPor (string, obrigatório, referência ao usuário)
- diaVisita (datetime, obrigatório)
- nomeCompleto (string, obrigatório)
- dataNascimento (date, obrigatório)
- whatsapp (string, obrigatório)
- email (string, obrigatório)
- bairro (string, obrigatório)
- cidade (string, obrigatório)
- comoConheceu (enum: familia-amigo, google, redesocial, passei-frente, obrigatório)
- pedidoOracao (text, opcional)

## 3. GESTÃO DE PESSOAS

### Adicionar/Editar Pessoa
- nome (string, obrigatório)
- sobrenome (string, obrigatório)
- sexo (enum: masculino, feminino, outro, nao-informar, obrigatório)
- estadoCivil (enum: solteiro, casado, divorciado, viuvo, uniao-estavel, obrigatório)
- dataNascimento (date, obrigatório)
- telefone (string, obrigatório)
- email (string, obrigatório)
- cep (string, obrigatório)
- rua (string, obrigatório)
- numero (string, obrigatório)
- complemento (string, opcional)
- bairro (string, obrigatório)
- cidade (string, obrigatório)
- estado (enum: todos os estados brasileiros, obrigatório)

### Atribuição
- pessoaId (integer, obrigatório, referência)
- cargoEclesiastico (enum: Pastor, Evangelista, Presbítero, Diácono, opcional)
- estagiosUsuario (array: Visitante, Novo Convertido, Membro, Participante de Ministério, Líder, obrigatório, múltipla seleção)
- ministeriosLider (array de IDs de ministérios, obrigatório se estagio incluir "Líder")
- ministeriosParticipante (array de IDs de ministérios, obrigatório se estagio incluir "Participante de Ministério")
- tipoUsuario (enum: Usuario, Admin, SuperAdmin, obrigatório)

## 4. FINANÇAS

### Nova Entrada
- categoria (enum: Dízimos, Ofertas, Cantina, Outros, obrigatório)
- autores (array de IDs de usuários, obrigatório, múltipla seleção)
- valor (decimal, obrigatório, > 0)
- dataEntrada (date, obrigatório)
- turno (enum: Dia, Tarde, Noite, obrigatório)
- tipoPagamento (enum: Dinheiro, Pix, Cartão, Outros, obrigatório)

### Nova Saída
- valor (decimal, obrigatório, > 0)
- dataSaida (date, obrigatório)
- motivo (text, obrigatório)
- ministerio (integer, obrigatório, referência a ministério)
- comprovante (arquivo, opcional: PDF, JPG, JPEG, PNG, DOC, DOCX)
- comprovanteNome (string, opcional)

### Relatório Financeiro (Filtros)
- tipo (enum: ENTRADA, SAIDA, ou vazio para todos, opcional)
- dataInicio (date, opcional)
- dataFim (date, opcional)
- categoria (enum: Dízimos, Ofertas, Cantina, Outros, opcional)
- search (string, opcional, busca em descrição, categoria ou valor)

## 5. INTEGRAÇÃO

### Integra Visitante
- visitanteId (integer, obrigatório, referência)
- nome (string, obrigatório)
- sobrenome (string, obrigatório)
- email (string, obrigatório)
- telefone (string, obrigatório)
- dataNascimento (date, opcional)
- sexo (enum: masculino, feminino, outro, nao-informar, opcional)
- estadoCivil (enum: solteiro, casado, divorciado, viuvo, uniao-estavel, opcional)
- cep (string, opcional)
- rua (string, opcional)
- numero (string, opcional)
- complemento (string, opcional)
- bairro (string, opcional)
- cidade (string, opcional)
- estado (enum: todos os estados, opcional)
- novoEstagio (enum: Novo Convertido, obrigatório)
- fotoPerfil (arquivo imagem, opcional, máximo 5MB)

### Novo Convertido
- recepcionadoPor (string, obrigatório, referência ao usuário)
- diaVisita (datetime, obrigatório)
- nomeCompleto (string, obrigatório)
- dataNascimento (date, obrigatório)
- whatsapp (string, obrigatório)
- email (string, obrigatório)
- bairro (string, obrigatório)
- cidade (string, obrigatório)
- comoConheceu (enum: familia-amigo, google, redesocial, passei-frente, obrigatório)
- pedidoOracao (text, opcional)
- estagio (fixo: "Novo Convertido")

### Membresia - Matrícula
- novoConvertidoId (integer, obrigatório, referência)
- nomeCompleto (string, obrigatório)
- email (string, obrigatório)
- telefone (string, obrigatório)
- dataNascimento (date, obrigatório)
- endereco (string, obrigatório)
- cidade (string, obrigatório)
- dataMatricula (date, obrigatório)

### Membresia - Aulas
- alunoId (integer, obrigatório, referência)
- aulaNumero (integer, 1-5, obrigatório)
- concluida (boolean, obrigatório)
- dataConclusao (date, opcional, preenchido quando concluida = true)

### Listar Membros (Filtros)
- search (string, opcional, busca em nome, email, telefone)
- dataMatricula (date, opcional)
- minAulasConcluidas (integer, opcional)
- minAulasNaoFeitas (integer, opcional)
- cidade (string, opcional)

## 6. EVENTOS

### Novo Evento
- titulo (string, obrigatório)
- descricao (text, opcional)
- data (date, obrigatório)
- hora (time, obrigatório)
- local (string, obrigatório)
- tipo (enum: Culto, Reunião, Ensino, Evento Especial, Treinamento, Outro, obrigatório)

### Agenda (Filtros/Visualização)
- viewMode (enum: week, month, year, opcional)
- currentDate (date, opcional)

## 7. RELATÓRIOS

### Formulário de Relatório (Recepção, Integração, Eventos)
- nomeMinisterio (string, obrigatório)
- mesReferencia (enum: 01-12, obrigatório)
- conteudo (text HTML, obrigatório, editor rich text)

### Relatórios Gerados
- id (integer, auto)
- nomeMinisterio (string)
- mesReferencia (string)
- anoReferencia (integer)
- dataGeracao (date)
- tamanho (string)
- arquivoPDF (blob ou path, opcional)

## 8. ANALYTICS (Integração)

### Filtros de Analytics
- dataInicio (date, opcional)
- dataFim (date, opcional)

## RESUMO DE ENTIDADES E RELACIONAMENTOS

### Entidades Principais:
1. **usuarios** - Usuários do sistema (autenticação e perfil)
2. **visitantes** - Visitantes cadastrados na recepção
3. **novos_convertidos** - Novos convertidos
4. **pessoas** - Pessoas cadastradas na gestão
5. **atribuicoes** - Atribuições de cargos, estágios e ministérios
6. **ministerios** - Ministérios da igreja
7. **entradas_financeiras** - Entradas financeiras
8. **saidas_financeiras** - Saídas financeiras
9. **eventos** - Eventos da igreja
10. **alunos_membresia** - Alunos de membresia
11. **aulas_membresia** - Aulas concluídas pelos alunos
12. **relatorios** - Relatórios gerados
13. **entrada_autores** - Relação muitos-para-muitos entre entradas e autores
14. **usuario_estagios** - Relação muitos-para-muitos entre usuários e estágios
15. **usuario_ministerios_lider** - Relação muitos-para-muitos entre usuários e ministérios como líder
16. **usuario_ministerios_participante** - Relação muitos-para-muitos entre usuários e ministérios como participante
