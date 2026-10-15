# Blueprint Completo — Chatbot ACME Bank PUC (Blip Builder)

Consolidado a partir de todas as imagens enviadas: o fluxograma original (Miro) + os prints do Builder + o painel de condições de saída do Atendimento humano.

**13 blocos. Layout igual ao do print do Builder.**

---

## Mapa visual (como fica no canvas)

```
                          [Início] <---------------------+
                              |                          |
                              v                          |
                        [Boas vindas]              [Erro padrao]
                       /      |      \                    ^
                      /       |       \                   |
                     v        v        v                  |
            [1. Cartoes]  [2. Saldo]  [3. Novo cliente]   |
              /   |   \        |             |            |
             v    v    v       v             v            |
          [1.1][1.2][1.3]  [2.1 Solicita]  [Atendimento]  |
             |    |    |        |            humano ]     |
             |    |    |        v             |           |
             |    |    |   [2.2 Exibe saldo]  |           |
             +----+----+--------+-------------+-----------+
                        (todos voltam ao Inicio)
```

---

## FASE 1 — Criar os 13 blocos com os textos

| # | Bloco | Conteúdo (texto exato) |
|---|---|---|
| 1 | **Início** | (sem texto — só ponto de entrada/retorno) |
| 2 | **Boas vindas** | msg 1: `Olá! {{contact.name}}!` + nova linha + `Seja bem-vindo(a)!` <br> msg 2: `Como posso te ajudar?` + linha vazia + `1. Dúvidas sobre cartões` / `2. Visualizar saldo` / `3. Quero ser cliente` |
| 3 | **Erro padrão** | `Desculpe, não entendi. Por favor, digite 1, 2 ou 3.` |
| 4 | **1. Cartões** | `Qual sua dúvida sobre cartões?` + linha vazia + `1. Saber a bandeira do cartão` / `2. Data de vencimento` / `3. Pontos e Milhas` |
| 5 | **1.1 Bandeiras** | `Nossos cartões podem possuir uma das seguintes bandeiras:` + linha vazia + `Master, Visa, XPTO` |
| 6 | **1.2 Data de Vencimento** | `As datas de vencimento das faturas dos cartões podem ocorrer nos dias: 7, 14 ou 21 de cada mês.` + linha vazia + `O cliente pode optar pela melhor data.` |
| 7 | **1.3 Pontos e Milhas** | `A cada R$1 gasto no cartão você acumula 3 pontos em nosso programa de fidelidade ACME.` + linha vazia + `Quanto mais usar mais pontos ganha.` |
| 8 | **2. Saldo** | (sem texto — só encaminha) |
| 9 | **2.1 Solicita Conta** | `Qual o número da sua conta com agência?` + linha vazia + `Ex.: 010203-9` |
| 10 | **2.2 Exibe o saldo** | `Seu saldo atualizado é de R$967,00` + linha vazia + `Limite pré-aprovado: R$ 10.000,00` |
| 11 | **3. Novo cliente** | `Aguarde um instante, estou te conectando a um de nossos atendentes.` |
| 12 | **Atendimento humano** | (bloco de transbordo — sem texto) |
| 13 | **Dialogflow NLP** | *(opcional — ver seção final)* |

---

## FASE 2 — Aguardar resposta

Nos blocos de menu, ative **"Aguardar resposta do usuário"**:

- **Boas vindas**
- **1. Cartões**
- **2.1 Solicita Conta** → aqui sim vale salvar em variável: `contaAgencia`

> Para os menus você **não precisa criar variável**. O painel de condições oferece
> **"Resposta do usuário"** como origem direta.

---

## FASE 3 — Condições de saída (estrutura real do painel)

Cada condição tem 3 partes: **Se** (origem) · **Condição** (comparação) · **Valores** (tags).
Blocos de condição são somados com **OU**. O campo "Valores" aceita **várias tags** — use isso
para cobrir número, sinônimos e acentuação de uma vez.

### Boas vindas

| Se | Condição | Valores (tags) | Ir para |
|---|---|---|---|
| Resposta do usuário | Contém | `1` `cartao` `cartão` `cartões` `cartoes` | 1. Cartões |
| **OU** Intenção identificada | Igual a | `Cartoes` | 1. Cartões |
| **OU** Resposta do usuário | Contém | `2` `saldo` | 2. Saldo |
| **OU** Intenção identificada | Igual a | `Saldo` | 2. Saldo |
| **OU** Resposta do usuário | Contém | `3` `cliente` | 3. Novo cliente |
| **OU** Intenção identificada | Igual a | `Cliente` | 3. Novo cliente |
| *(saída padrão)* | — | — | Erro padrão |

> O par "palavra-chave **OU** intenção" é o que faz o bot aceitar tanto `2` quanto
> uma frase livre como "quero ver meu saldo".

### 1. Cartões

| Se | Condição | Valores (tags) | Ir para |
|---|---|---|---|
| Resposta do usuário | Contém | `1` `bandeira` `bandeiras` | 1.1 Bandeiras |
| **OU** Intenção identificada | Igual a | `Bandeira` | 1.1 Bandeiras |
| **OU** Resposta do usuário | Contém | `2` `vencimento` `data` | 1.2 Data de Vencimento |
| **OU** Intenção identificada | Igual a | `Vencimento` | 1.2 Data de Vencimento |
| **OU** Resposta do usuário | Contém | `3` `milhas` `pontos` | 1.3 Pontos e Milhas |
| **OU** Intenção identificada | Igual a | `Milhas` | 1.3 Pontos e Milhas |
| *(saída padrão)* | — | — | 1. Cartões (repete) |

### Saídas diretas (saída padrão, sem condição)

| De | Para |
|---|---|
| Início | Boas vindas |
| Erro padrão | Início |
| 2. Saldo | 2.1 Solicita Conta |
| 2.1 Solicita Conta | 2.2 Exibe o saldo |
| 3. Novo cliente | Atendimento humano |

### Loop-backs (os 4 que voltam ao começo)

| De | Para |
|---|---|
| 1.1 Bandeiras | Início |
| 1.2 Data de Vencimento | Início |
| 1.3 Pontos e Milhas | Início |
| 2.2 Exibe o saldo | Início |

### Atendimento humano — Condições de Saída

| Condição | Ir para |
|---|---|
| Se ticket finalizado pelo atendente | Início |
| Se ticket finalizado pelo cliente | Início |
| Se ticket finalizado por inatividade | Início |

Pesquisa de satisfação: **desligada** nas três.

---

## FASE 4 — Publicar e testar

No painel "Teste de chatbot publicado":

| Digite | Esperado |
|---|---|
| `oi` | saudação + menu principal |
| `1` ou `cartões` | submenu de cartões |
| `1` | bandeiras (Master, Visa, XPTO) → volta ao menu |
| `2` no submenu | datas 7, 14, 21 → volta ao menu |
| `3` no submenu | pontos e milhas → volta ao menu |
| `2` ou `saldo` | pede a conta |
| `010203-9` | exibe saldo + limite → volta ao menu |
| `3` ou `cliente` | mensagem de aguarde → transbordo |
| `asdkjhasd` | Erro padrão → volta ao menu |

---

## NLP / Intenções — abordagem nativa

O painel mostra **"Intenção identificada"** como origem de condição. Isso é o motor de
NLP do próprio Blip, configurado fora do fluxo:

1. Vá na aba de **IA / Inteligência Artificial** do bot.
2. Cadastre as intenções e seus exemplos de treinamento:
   - `Cartoes` — "dúvida sobre cartão", "meu cartão", "quero saber do cartão"
   - `Saldo` — "quero ver meu saldo", "quanto tenho", "consultar saldo"
   - `Cliente` — "quero abrir conta", "ser cliente", "falar com atendente"
   - `Bandeira`, `Vencimento`, `Milhas` — para o submenu
3. Treine o modelo e publique.
4. No fluxo, use **Intenção identificada / Igual a / `NomeDaIntencao`** nas condições
   (já mapeado nas tabelas da Fase 3).

> Com isso, o proxy no Google Cloud (`dialogflow/05-cloud-function.js`) fica
> **desnecessário** para este caso. Aquele material só é preciso se você tiver que usar
> um agente Dialogflow externo já existente, em vez do NLP nativo do Blip.

---

## Backup

Depois de montado e testado: **Configurações → Versões → Exportar fluxo**.
Esse JSON é o único arquivo que o Blip reimporta sem erro — é o seu backup e o que permite clonar o bot para outro ambiente.
