# Chatbot ACME Bank no Blip — Guia de Montagem Manual

## Por que o import do JSON falhou

O Blip mostrou *"The specified file doesn't contain a valid flow for importing"*. Isso é esperado: **o Blip Builder só importa um JSON que ele mesmo exportou.** O arquivo de exportação carrega o identificador interno do bot e uma estrutura que muda entre versões da plataforma — não existe um formato público para montar de fora. Por isso, o caminho confiável é montar no Builder (leva ~15 min) seguindo o mapa exato abaixo. Depois de montado, você pode **exportar** o seu próprio JSON pela aba Configurações → Versões, e aí sim ele fica reimportável/versionável.

---

## Antes de começar

- Crie um bot novo em **portal.blip.ai** → **Criar chatbot** → modelo **"Do zero" / "Construção do zero"** (Builder visual).
- Cada "balão" do seu fluxograma vira um **bloco**. Os balões verdes **"Resposta contato"** NÃO são blocos: são a etapa *aguardar resposta do usuário*, configurada dentro do próprio bloco de menu (ative **"Aguardar resposta do usuário"** e defina a variável).
- **"Ir para → Início"** = uma conexão de saída apontando de volta para o primeiro bloco.

> **Dica (v1.1 do `fluxo-acme-bank-blip.json`):** se o Bloco 1 tiver a saudação *e* o menu, todo retorno "Ir para → Início" repete *"Olá! Seja bem-vindo(a)!"*. Para evitar isso, separe em dois blocos — **"Boas-vindas"** (só a saudação, sem aguardar resposta) → **"Menu Principal"** (o menu, aguardando resposta) — e aponte os retornos para o **Menu Principal**. É assim que está o JSON de referência; teste o comportamento com `node tools/simulate-flow.js`.

---

## Os 8 blocos

### Bloco 1 — "Boas-vindas / Menu"  (bloco inicial)

**Conteúdo (2 mensagens, nesta ordem):**

1. Texto:
```
Olá! {{contact.name}}!
Seja bem-vindo(a)!
```
2. Texto (o menu):
```
Como posso te ajudar?

1. Dúvidas sobre cartões
2. Visualizar saldo
3. Quero ser cliente
```

**Aguardar resposta:** ative e salve na variável `opcaoMenu`.

**Saídas (Condições de saída):** clique no conector do bloco -> "Definir a saída padrão" -> adicione as condições:

| # | A variável | Comparação | Valor | Vai para o bloco |
|---|---|---|---|---|
| 1 | `opcaoMenu` | igual a | `1` | Bloco 2 (Cartões) |
| 2 | `opcaoMenu` | igual a | `2` | Bloco 6 (Saldo) |
| 3 | `opcaoMenu` | igual a | `3` | Bloco 8 (Cliente) |
| - | (saída padrão) | - | - | Bloco 1 (repete o menu) |

> Dica: em "Comparação" use **"contém"** em vez de "igual a" se quiser aceitar tanto `1` quanto `1. Dúvidas...`.

---

### Bloco 2 — "Cartões: Submenu"

**Conteúdo (texto):**
```
Qual sua dúvida sobre cartões?

1. Saber a bandeira do cartão
2. Data de vencimento
3. Pontos e Milhas
```
**Aguardar resposta:** variável `opcaoCartoes`.

**Saídas:**

| # | Variável | Comparação | Valor | Vai para |
|---|---|---|---|---|
| 1 | `opcaoCartoes` | igual a | `1` | Bloco 3 (Bandeira) |
| 2 | `opcaoCartoes` | igual a | `2` | Bloco 4 (Vencimento) |
| 3 | `opcaoCartoes` | igual a | `3` | Bloco 5 (Milhas) |
| - | padrão | - | - | Bloco 2 (repete) |

---

### Bloco 3 — "Cartões: Bandeira"

**Conteúdo (texto):**
```
Nossos cartões podem possuir uma das seguintes bandeiras:

Master, Visa, XPTO
```
**Aguardar resposta:** desligado.
**Saída padrão ->** Bloco 1 (Início).

### Bloco 4 — "Cartões: Vencimento"

**Conteúdo (texto):**
```
As datas de vencimento das faturas dos cartões podem ocorrer nos dias: 7, 14 ou 21 de cada mês.

O cliente pode optar pela melhor data.
```
**Saída padrão ->** Bloco 1 (Início).

### Bloco 5 — "Cartões: Pontos e Milhas"

**Conteúdo (texto):**
```
A cada R$1 gasto no cartão você acumula 3 pontos em nosso programa de fidelidade ACME.

Quanto mais usar mais pontos ganha.
```
**Saída padrão ->** Bloco 1 (Início).

---

### Bloco 6 — "Saldo: Pede conta"

**Conteúdo (texto):**
```
Qual o número da sua conta com agência?

Ex.: 010203-9
```
**Aguardar resposta:** variável `contaAgencia`.
**Saída padrão ->** Bloco 7.

### Bloco 7 — "Integração API ACME Bank (Mock)"

**Ação de entrada -> Requisição (HTTP):**
- Método: `GET`
- URL: (a URL gerada no Mocky.io — ver `guia-mock-saldo.md`)
- Salvar corpo da resposta em: `respostaSaldo`
- Salvar status em: `statusSaldo`

**Ação de entrada -> Executar script** (extrai os valores):
- Entrada: `respostaSaldo` · Saída: `dadosSaldo`
```javascript
function run(respostaSaldo) {
  try {
    var r = JSON.parse(respostaSaldo);
    return { saldo: r.saldo.formatado, limite: r.limite.formatado };
  } catch (e) {
    return { saldo: "indisponível", limite: "indisponível" };
  }
}
```

**Conteúdo (texto):**
```
Seu saldo atualizado é de {{dadosSaldo@saldo}}

Limite pré-aprovado: {{dadosSaldo@limite}}
```
> Só para testar rápido sem API, use texto fixo: `Seu saldo atualizado é de R$967,00` / `Limite pré-aprovado: R$ 10.000,00`.

**Saída padrão ->** Bloco 1 (Início).

---

### Bloco 8 — "Cliente: Aguarde / Transbordo"

**Conteúdo (texto):**
```
Aguarde um instante, estou te conectando a um de nossos atendentes.
```
**Ação de saída -> Encaminhar para o atendimento humano** (Redirect para a fila do **Blip Desk**).
Não retorna ao menu — a conversa fica com o agente.

---

## Mapa de ligações

```
[1] Boas-vindas + Menu
      |-- 1 --> [2] Cartões
      |            |-- 1 --> [3] Bandeira ------> volta [1]
      |            |-- 2 --> [4] Vencimento ----> volta [1]
      |            +-- 3 --> [5] Milhas --------> volta [1]
      |-- 2 --> [6] Pede conta --> [7] API Mock --> msg saldo --> volta [1]
      +-- 3 --> [8] Aguarde ------> Atendimento Humano (Desk)
```

## Depois de montar
Configurações -> **Versões** -> **Publicar fluxo** para testar. Se quiser um backup versionável, use **Exportar fluxo** ali mesmo — o JSON exportado pelo próprio Blip é o único que reimporta sem erro.

---

## Alternativa mais rápida: extensão BuilderGPT

Na **Blip Store** (dentro do portal, menu de extensões) existe a extensão **BuilderGPT**. Ela gera um rascunho de fluxo a partir de uma descrição em texto. Você pode colar a descrição do fluxo (o mapa de ligações acima) e ela monta os blocos automaticamente — depois é só ajustar os textos e as condições conforme este guia. É o jeito mais próximo de um "import" que funciona de fato no Blip.
