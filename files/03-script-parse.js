function run(respostaDialogflow) {
  try {
    var r = JSON.parse(respostaDialogflow);
    var q = r.queryResult || {};
    var intent = (q.intent && q.intent.displayName) || "fallback";

    return {
      intent: intent,
      confianca: q.intentDetectionConfidence || 0,
      resposta: q.fulfillmentText || "",
      parametros: q.parameters || {}
    };
  } catch (e) {
    return {
      intent: "erro",
      confianca: 0,
      resposta: "",
      parametros: {}
    };
  }
}
