// Tests for the Blip -> Dialogflow proxy and the Blip parse script. Run: cd files && npm test
// The Dialogflow SDK is replaced by a fake, so no Google credentials or network are needed.
const test = require('node:test');
const assert = require('node:assert');
const Module = require('module');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let lastRequest;
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '@google-cloud/dialogflow') {
    return {
      SessionsClient: class {
        projectAgentSessionPath(project, session) { return `projects/${project}/agent/sessions/${session}`; }
        async detectIntent(req) {
          lastRequest = req;
          return [{
            responseId: 'r-1',
            queryResult: {
              queryText: req.queryInput.text.text,
              parameters: {},
              fulfillmentText: 'Vou consultar seu saldo.',
              intent: { displayName: 'consultar_saldo' },
              intentDetectionConfidence: 0.92,
              languageCode: 'pt-br',
            },
          }];
        }
      },
    };
  }
  return realLoad.call(this, request, ...rest);
};

function loadProxy(env) {
  Object.assign(process.env, env);
  for (const k of Object.keys(env)) if (env[k] === undefined) delete process.env[k];
  const file = path.join(__dirname, '..', '05-cloud-function.js');
  delete require.cache[require.resolve(file)];
  return require(file);
}

function call(fn, { method = 'POST', headers = {}, body } = {}) {
  return new Promise((resolve) => {
    const req = { method, body, get: (h) => headers[h.toLowerCase()] };
    const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { resolve({ status: this.statusCode, body: b }); } };
    fn(req, res);
  });
}

const body = { queryInput: { text: { text: 'quero ver meu saldo', languageCode: 'pt-BR' } }, queryParams: { payload: { contactIdentity: 'user@0mn.io' } } };

test('refuses to run when PROXY_API_KEY is not configured (fail closed)', async () => {
  const { detectIntent } = loadProxy({ PROJECT_ID: 'demo', PROXY_API_KEY: undefined });
  const r = await call(detectIntent, { headers: {}, body });
  assert.strictEqual(r.status, 500);
});

test('rejects a wrong x-api-key', async () => {
  const { detectIntent } = loadProxy({ PROJECT_ID: 'demo', PROXY_API_KEY: 'secret' });
  const r = await call(detectIntent, { headers: { 'x-api-key': 'nope' }, body });
  assert.strictEqual(r.status, 401);
});

test('rejects GET and empty text', async () => {
  const { detectIntent } = loadProxy({ PROJECT_ID: 'demo', PROXY_API_KEY: 'secret' });
  assert.strictEqual((await call(detectIntent, { method: 'GET', headers: { 'x-api-key': 'secret' } })).status, 405);
  assert.strictEqual((await call(detectIntent, { headers: { 'x-api-key': 'secret' }, body: {} })).status, 400);
});

test('forwards text to Dialogflow and returns the Dialogflow-shaped answer', async () => {
  const { detectIntent } = loadProxy({ PROJECT_ID: 'demo', PROXY_API_KEY: 'secret' });
  const r = await call(detectIntent, { headers: { 'x-api-key': 'secret' }, body });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.queryResult.intent.displayName, 'consultar_saldo');
  // session id is sanitised to Dialogflow's allowed characters
  assert.strictEqual(lastRequest.session, 'projects/demo/agent/sessions/user0mnio');
  assert.strictEqual(lastRequest.queryInput.text.languageCode, 'pt-BR');
});

test('Blip parse script (03-script-parse.js) reads the example response', () => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '03-script-parse.js'), 'utf8'), ctx);
  const example = fs.readFileSync(path.join(__dirname, '..', '04-response-exemplo.json'), 'utf8');
  const out = ctx.run(example);
  assert.strictEqual(out.intent, 'consultar_saldo');
  assert.strictEqual(out.confianca, 0.92);
  assert.strictEqual(ctx.run('not json').intent, 'erro');
});
