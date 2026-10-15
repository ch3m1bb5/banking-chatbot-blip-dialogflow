# Checklist de Montagem — Chatbot ACME Bank (Blip)

Siga na ordem. Marque `[x]` conforme concluir. A ideia é: **criar todos os blocos primeiro, ligar depois, integrar a API por último.**

---

## Fase 1 — Criar os blocos (só os balões, com os textos)

Crie cada bloco e cole o texto. Ainda NÃO ligue nada.

- [ ] **Início** — ponto de entrada (pode ficar vazio; só encaminha pro Boas vindas)
- [ ] **Boas vindas** — 2 mensagens de texto:
  - `Olá! {{contact.name}}!\nSeja bem-vindo(a)!`
  - `Como posso te ajudar?\n\n1. Dúvidas sobre cartões\n2. Visualizar saldo\n3. Quero ser cliente`
- [ ] **1. Cartões** — `Qual sua dúvida sobre cartões?\n\n1. Saber a bandeira do cartão\n2. Data de vencimento\n3. Pontos e Milhas`
- [ ] **1.1 Bandeiras** — `Nossos cartões podem possuir uma das seguintes bandeiras:\n\nMaster, Visa, XPTO`
- [ ] **1.2 Data de Vencimento** — `As datas de vencimento das faturas dos cartões podem ocorrer nos dias: 7, 14 ou 21 de cada mês.\n\nO cliente pode optar pela melhor data.`
- [ ] **1.3 Pontos e Milhas** — `A cada R$1 gasto no cartão você acumula 3 pontos em nosso programa de fidelidade ACME.\n\nQuanto mais usar mais pontos ganha.`
- [ ] **2. Saldo** — (pode ir direto pro 2.1, sem texto próprio)
- [ ] **2.1 Solicita Conta** — `Qual o número da sua conta com agência?\n\nEx.: 010203-9`
- [ ] **2.2 Exibe o saldo** — texto FIXO por enquanto: `Seu saldo atualizado é de R$967,00\n\nLimite pré-aprovado: R$ 10.000,00`
- [ ] **3. Novo cliente** — `Aguarde um instante, estou te conectando a um de nossos atendentes.`
- [ ] **Atendimento humano** — bloco de transbordo (Desk)
- [ ] **Erro padrão** — `Desculpe, não entendi. Por favor, digite 1, 2 ou 3.`

---

## Fase 2 — Configurar "aguardar resposta" + variável

Nos blocos de MENU, ative "Aguardar resposta do usuário" e defina a variável:

- [ ] **Boas vindas** → variável `opcaoMenu`
- [ ] **1. Cartões** → variável `opcaoCartoes`
- [ ] **2.1 Solicita Conta** → variável `contaAgencia`

---

## Fase 3 — Ligar as saídas com condição

### Boas vindas (variável `opcaoMenu`)
- [ ] contém `1` → **1. Cartões**
- [ ] contém `2` → **2. Saldo**
- [ ] contém `3` → **3. Novo cliente**
- [ ] saída padrão → **Erro padrão**

### 1. Cartões (variável `opcaoCartoes`)
- [ ] contém `1` → **1.1 Bandeiras**
- [ ] contém `2` → **1.2 Data de Vencimento**
- [ ] contém `3` → **1.3 Pontos e Milhas**
- [ ] saída padrão → **1. Cartões** (repete)

### Saídas simples (saída padrão apontando pro destino)
- [ ] **Início** → **Boas vindas**
- [ ] **Erro padrão** → **Boas vindas** (ou **Início**)
- [ ] **2. Saldo** → **2.1 Solicita Conta**
- [ ] **2.1 Solicita Conta** → **2.2 Exibe o saldo**
- [ ] **3. Novo cliente** → **Atendimento humano**

### Loop-backs "Ir para → Início" (os que voltam pro começo)
- [ ] **1.1 Bandeiras** → **Início**
- [ ] **1.2 Data de Vencimento** → **Início**
- [ ] **1.3 Pontos e Milhas** → **Início**
- [ ] **2.2 Exibe o saldo** → **Início**

### Atendimento humano (condições de saída do ticket)
- [ ] Se finalizado pelo atendente → **Início**
- [ ] Se finalizado pelo cliente → **Início**
- [ ] Se finalizado por inatividade → **Início**

---

## Fase 4 — Testar (sem API ainda)

- [ ] **Publicar fluxo**
- [ ] Testar `1` → cai em Cartões
- [ ] Testar `1` de novo → cai em Bandeiras → volta ao menu
- [ ] Testar `2` → pede conta → exibe saldo fixo → volta ao menu
- [ ] Testar `3` → mensagem de aguarde → transbordo
- [ ] Testar `oi` (bobagem) → cai no **Erro padrão**

> Se algum menu não desviar, o problema quase sempre é a **condição de saída** (variável errada ou comparação "igual a" onde deveria ser "contém").

---

## Fase 5 — Integrar a API (só depois de tudo funcionando)

No bloco **2.2 Exibe o saldo** (ver `guia-mock-saldo.md`):

- [ ] Criar endpoint no Mocky.io e copiar a URL
- [ ] Ação de entrada → Requisição GET → salvar em `respostaSaldo` / `statusSaldo`
- [ ] Ação de entrada → Executar script → saída `dadosSaldo`
- [ ] Trocar o texto fixo por `{{dadosSaldo@saldo}}` e `{{dadosSaldo@limite}}`
- [ ] Publicar e testar `2` de novo → saldo agora vem da API

---

## Fase 6 — Backup (opcional, recomendado)

- [ ] Configurações → Versões → **Exportar fluxo** (esse JSON é o único reimportável)
