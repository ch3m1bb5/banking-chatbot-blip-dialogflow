# Prompt para a extensão BuilderGPT (Blip Store)

## Como usar
1. No portal do Blip, abra a **Blip Store** e instale/abra a extensão **BuilderGPT**.
2. Cole o prompt abaixo no campo de descrição da extensão.
3. Gere o fluxo, revise os blocos criados e ajuste textos/condições conforme o `checklist-montagem-blip.md`.
4. Publique o fluxo.

> A extensão gera um rascunho — ela pode nomear blocos de forma diferente ou não criar todas as condições. Use o checklist para conferir os detalhes (variáveis, "contém", loop-backs).

---

## PROMPT (copie tudo daqui para baixo)

Crie um fluxo de atendimento para um banco chamado "ACME Bank" com os blocos e conexões abaixo. Use menus por número. Sempre que o usuário digitar algo fora das opções, envie para um bloco de erro que repete o menu principal.

BLOCO "Início": ponto de entrada, encaminha para o bloco "Boas vindas".

BLOCO "Boas vindas": envia a mensagem "Olá! {{contact.name}}! Seja bem-vindo(a)!" e depois envia o menu "Como posso te ajudar? 1. Dúvidas sobre cartões 2. Visualizar saldo 3. Quero ser cliente". Aguarda a resposta do usuário e salva na variável "opcaoMenu". Condições de saída:
- se opcaoMenu contém "1", vai para "1. Cartões"
- se opcaoMenu contém "2", vai para "2. Saldo"
- se opcaoMenu contém "3", vai para "3. Novo cliente"
- senão, vai para "Erro padrão"

BLOCO "Erro padrão": envia "Desculpe, não entendi. Por favor, digite 1, 2 ou 3." e volta para "Boas vindas".

BLOCO "1. Cartões": envia o menu "Qual sua dúvida sobre cartões? 1. Saber a bandeira do cartão 2. Data de vencimento 3. Pontos e Milhas". Aguarda a resposta e salva na variável "opcaoCartoes". Condições de saída:
- se opcaoCartoes contém "1", vai para "1.1 Bandeiras"
- se opcaoCartoes contém "2", vai para "1.2 Data de Vencimento"
- se opcaoCartoes contém "3", vai para "1.3 Pontos e Milhas"
- senão, repete o bloco "1. Cartões"

BLOCO "1.1 Bandeiras": envia "Nossos cartões podem possuir uma das seguintes bandeiras: Master, Visa, XPTO" e depois vai para "Início".

BLOCO "1.2 Data de Vencimento": envia "As datas de vencimento das faturas dos cartões podem ocorrer nos dias: 7, 14 ou 21 de cada mês. O cliente pode optar pela melhor data." e depois vai para "Início".

BLOCO "1.3 Pontos e Milhas": envia "A cada R$1 gasto no cartão você acumula 3 pontos em nosso programa de fidelidade ACME. Quanto mais usar mais pontos ganha." e depois vai para "Início".

BLOCO "2. Saldo": vai direto para "2.1 Solicita Conta".

BLOCO "2.1 Solicita Conta": envia "Qual o número da sua conta com agência? Ex.: 010203-9". Aguarda a resposta e salva na variável "contaAgencia". Depois vai para "2.2 Exibe o saldo".

BLOCO "2.2 Exibe o saldo": envia "Seu saldo atualizado é de R$967,00. Limite pré-aprovado: R$ 10.000,00" e depois vai para "Início". (Observação: este bloco receberá depois uma requisição HTTP para buscar o saldo real; por enquanto use os valores fixos.)

BLOCO "3. Novo cliente": envia "Aguarde um instante, estou te conectando a um de nossos atendentes." e depois encaminha para o atendimento humano (transbordo para fila de agentes).

BLOCO "Atendimento humano": bloco de atendimento humano. Ao finalizar o ticket (pelo atendente, pelo cliente ou por inatividade), voltar para "Início".
