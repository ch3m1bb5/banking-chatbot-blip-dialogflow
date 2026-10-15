#!/usr/bin/env node
/**
 * Offline runner for the Blip flow export — test the bot without a Blip account.
 *
 *   node tools/simulate-flow.js "Oi" "2" "010203-9" "3"
 *
 * Each argument is one user message. The script walks fluxo-acme-bank-blip.json exactly as
 * exported: sends each block's messages, waits for input where the block waits, follows the
 * regex outputs (or the default output) and runs the entering actions — the HTTP request is
 * answered with mock-saldo-resposta.json and the ExecuteScript code runs as written.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const { flow } = JSON.parse(fs.readFileSync(path.join(root, 'fluxo-acme-bank-blip.json'), 'utf8'));
const mockBody = fs.readFileSync(path.join(root, 'mock-saldo-resposta.json'), 'utf8');
const vars = { 'contact.name': process.env.CONTACT_NAME || 'Rodrigo' };
const log = [];

const render = (text) =>
  text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const [name, prop] = key.split('@');
    if (!prop) return vars[name] ?? '';
    try { return JSON.parse(vars[name])[prop]; } catch { return ''; }
  });

function runEnteringActions(state) {
  for (const a of state.$enteringCustomActions || []) {
    const s = a.action.settings;
    if (a.action.type === 'ProcessHttp') {
      vars[s.responseStatusVariable] = '200';
      vars[s.responseBodyVariable] = mockBody;
      log.push({ who: 'sys', text: `HTTP ${s.method} ${s.uri} -> 200 (mock-saldo-resposta.json)` });
    } else if (a.action.type === 'ExecuteScript') {
      const ctx = {}; vm.createContext(ctx); vm.runInContext(s.source, ctx);
      const out = ctx.run(...s.inputVariables.map((v) => vars[v]));
      vars[s.outputVariable] = JSON.stringify(out);
      log.push({ who: 'sys', text: `ExecuteScript -> ${s.outputVariable} = ${vars[s.outputVariable]}` });
    }
  }
}

function sendMessages(state) {
  for (const a of state.$contentActions || []) {
    const c = a.action.settings.content;
    if (typeof c === 'string') log.push({ who: 'bot', text: render(c) });
    else log.push({ who: 'bot', text: render(c.text), options: (c.options || []).map((o) => o.text) });
  }
}

let current = Object.values(flow).find((s) => s.root).id;
function runUntilInput() {
  for (let i = 0; i < 50; i++) {
    const state = flow[current];
    runEnteringActions(state);
    sendMessages(state);
    if (state.input && state.input.bypass === false) return;
    current = state.$defaultOutput.stateId;
  }
  throw new Error('flow loops without waiting for input');
}
function userSays(text) {
  log.push({ who: 'user', text });
  const state = flow[current];
  if (state.input && state.input.variable) vars[state.input.variable] = text;
  const match = (state.$conditionOutputs || []).find((o) =>
    o.conditions.every((c) => c.values.some((v) => new RegExp(v, 'i').test(text.trim()))));
  const next = match ? match.stateId : state.$defaultOutput.stateId;
  log.push({ who: 'route', text: `${state.id} -> ${next}` });
  current = next;
  runUntilInput();
}

const inputs = process.argv.slice(2);
if (!inputs.length) inputs.push('Oi', '1', '3', '2', '010203-9', 'abc', '3');
log.push({ who: 'user', text: inputs[0] });
runUntilInput(); // the first message starts the conversation at the root block
inputs.slice(1).forEach(userSays);

if (process.env.JSON) console.log(JSON.stringify(log, null, 1));
else for (const m of log) {
  const tag = { user: 'USER >', bot: 'BOT  <', route: '   ->', sys: '   **' }[m.who];
  console.log(`${tag} ${m.text.replace(/\n+/g, ' | ')}`);
}
