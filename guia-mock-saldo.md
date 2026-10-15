# Mock de Saldo — ACME Bank (para o Bloco 7)

Este mock deixa o bloco **"Integração API do ACME Bank"** funcionando de ponta a ponta no teste, com valores vindos de uma requisição HTTP real (e não fixos no texto).

---

## Passo 1 — Criar o endpoint no Mocky.io

1. Acesse **https://designer.mocky.io**.
2. **HTTP Status:** `200`.
3. **Response Content-Type:** `application/json`.
4. **Charset:** `UTF-8`.
5. No corpo (**Body / HTTP Response Body**), cole exatamente o conteúdo do arquivo `mock-saldo-resposta.json`:

```json
{
  "status": "success",
  "conta": { "agencia": "0001", "numero": "010203-9", "titular": "Cliente ACME" },
  "saldo": { "valor": 967.00, "formatado": "R$ 967,00", "moeda": "BRL" },
  "limite": { "preAprovado": 10000.00, "formatado": "R$ 10.000,00", "moeda": "BRL" },
  "atualizadoEm": "2026-07-29T23:50:00-03:00"
}
```

6. Clique em **Generate my HTTP Response**. Ele te dá uma URL, algo como:
   `https://run.mocky.io/v3/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
7. **Copie essa URL** — ela substitui a URL de exemplo do JSON do fluxo.

---

## Passo 2 — Configurar a Requisição HTTP no Bloco 7 (Blip)

No bloco **"Integração API do ACME Bank (Mock)"**, aba **Ações de entrada → Requisição**:

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **URL** | *(cole a URL do Mocky.io do Passo 1)* |
| **Header** | `Content-Type: application/json` |
| **Status da resposta em** | `statusSaldo` |
| **Corpo da resposta em** | `respostaSaldo` |

> Se quiser passar a conta digitada pelo usuário para a API real depois, é só acrescentar `?conta={{contaAgencia}}` na URL (não faça isso no mock — ele ignora parâmetros).

---

## Passo 3 — Extrair os valores da resposta (Executar Script)

Ainda nas **Ações de entrada**, adicione uma ação **Executar Script** logo após a Requisição:

- **Variáveis de entrada:** `respostaSaldo`
- **Variável de saída:** `dadosSaldo`
- **Função:**

```javascript
function run(respostaSaldo) {
  try {
    var r = JSON.parse(respostaSaldo);
    return {
      saldo: r.saldo.formatado,      // "R$ 967,00"
      limite: r.limite.formatado,    // "R$ 10.000,00"
      status: r.status               // "success"
    };
  } catch (e) {
    return { saldo: "indisponível", limite: "indisponível", status: "erro" };
  }
}
```

> O Blip salva o retorno do script na variável `dadosSaldo`. Se o seu Builder só aceitar retorno como texto, troque o `return {...}` por `return JSON.stringify({...})` e faça um segundo script/parse — mas na maioria das versões o objeto direto funciona e vira `dadosSaldo@saldo`, `dadosSaldo@limite`.

---

## Passo 4 — Usar as variáveis na mensagem (troca o texto fixo)

No **conteúdo de texto** do Bloco 7, substitua os valores fixos por variáveis:

```
Seu saldo atualizado é de {{dadosSaldo@saldo}}

Limite pré-aprovado: {{dadosSaldo@limite}}
```

Resultado no teste (com o mock):
```
Seu saldo atualizado é de R$ 967,00

Limite pré-aprovado: R$ 10.000,00
```

---

## Passo 5 — (Opcional) Tratar erro da API

Adicione uma **saída condicional** no Bloco 7 antes de mandar a mensagem:

| Condição | Vai para |
|---|---|
| `{{statusSaldo}}` **igual a** `200` | mensagem de saldo (segue normal) |
| **Padrão / senão** | bloco de erro: *"Não consegui consultar seu saldo agora. Tente novamente em instantes."* → volta ao Início |

Assim, quando você trocar o mock pela API real do banco, o fluxo já trata indisponibilidade sem quebrar.

---

## Quando for para produção

- Troque a URL do Mocky.io pela URL real da API do ACME Bank.
- Se a API exigir autenticação, adicione o header `Authorization: Bearer {{seuToken}}` na Requisição.
- Ajuste os caminhos no script (`r.saldo.formatado` etc.) conforme o formato real de resposta da API.
