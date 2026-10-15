/**
 * Proxy Blip -> Dialogflow v2
 *
 * Por que existe: o Dialogflow v2 exige um access_token OAuth2 assinado a partir
 * da service account. O Blip nao faz essa assinatura, entao este servico faz:
 * recebe a mensagem do Blip, autentica, chama o detectIntent e devolve a resposta.
 *
 * A credencial NUNCA fica no codigo. Ela vem da variavel de ambiente
 * GOOGLE_APPLICATION_CREDENTIALS (no Cloud Functions/Cloud Run isso e automatico
 * quando voce anexa a service account ao servico -- nem precisa do arquivo JSON).
 *
 * Deploy (Cloud Functions gen2):
 *   gcloud functions deploy blip-dialogflow-proxy \
 *     --gen2 --runtime=nodejs20 --region=us-central1 \
 *     --source=. --entry-point=detectIntent \
 *     --trigger-http --allow-unauthenticated \
 *     --service-account=SUA_SERVICE_ACCOUNT@SEU_PROJETO.iam.gserviceaccount.com \
 *     --set-env-vars=PROJECT_ID=SEU_PROJECT_ID,PROXY_API_KEY=umaChaveForte
 */

const { SessionsClient } = require('@google-cloud/dialogflow');

const PROJECT_ID = process.env.PROJECT_ID;
const PROXY_API_KEY = process.env.PROXY_API_KEY;

const client = new SessionsClient();

exports.detectIntent = async (req, res) => {
  // Fail closed: a funcao e publica (--allow-unauthenticated), entao sem chave
  // configurada ninguem passa -- evita expor o Dialogflow (e a sua conta GCP).
  if (!PROXY_API_KEY || !PROJECT_ID) {
    console.error('PROXY_API_KEY e PROJECT_ID precisam estar configurados');
    return res.status(500).json({ erro: 'proxy nao configurado' });
  }

  // Autenticacao simples do Blip -> proxy (header x-api-key)
  if (req.get('x-api-key') !== PROXY_API_KEY) {
    return res.status(401).json({ erro: 'nao autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'use POST' });
  }

  try {
    const texto =
      req.body?.queryInput?.text?.text ||
      req.body?.text ||
      '';

    const idioma =
      req.body?.queryInput?.text?.languageCode || 'pt-BR';

    const sessionId =
      req.body?.queryParams?.payload?.contactIdentity ||
      req.body?.sessionId ||
      'sessao-anonima';

    if (!texto) {
      return res.status(400).json({ erro: 'texto vazio' });
    }

    const sessionPath = client.projectAgentSessionPath(
      PROJECT_ID,
      // sanitiza: o Dialogflow aceita ate 36 chars alfanumericos na sessao
      String(sessionId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36) || 'anon'
    );

    const [response] = await client.detectIntent({
      session: sessionPath,
      queryInput: {
        text: { text: texto, languageCode: idioma }
      }
    });

    // Devolve no mesmo formato do Dialogflow, para o script do Blip funcionar igual
    return res.status(200).json({
      responseId: response.responseId,
      queryResult: {
        queryText: response.queryResult.queryText,
        parameters: response.queryResult.parameters || {},
        fulfillmentText: response.queryResult.fulfillmentText || '',
        intent: {
          displayName: response.queryResult.intent?.displayName || 'fallback'
        },
        intentDetectionConfidence:
          response.queryResult.intentDetectionConfidence || 0,
        languageCode: response.queryResult.languageCode
      }
    });
  } catch (e) {
    console.error('erro no detectIntent:', e);
    return res.status(500).json({
      erro: 'falha ao consultar o Dialogflow',
      queryResult: {
        intent: { displayName: 'erro' },
        intentDetectionConfidence: 0,
        fulfillmentText: ''
      }
    });
  }
};
