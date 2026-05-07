// api/detect-pagina.js
// Primeira chamada: a IA le a copy e infere tipo de pagina + publico.
// Devolve o que detectou + perguntas se tiver duvida.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { conteudo } = req.body || {};

  if (!conteudo || typeof conteudo !== 'string' || conteudo.trim().length < 100) {
    return res.status(400).json({ error: 'Conteudo precisa ter ao menos 100 caracteres.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API Groq nao configurada no servidor.' });
  }

  const systemPrompt = `Voce e um analista de paginas de vendas para lancamentos pagos da metodologia Willian Baldan (Rise).

ATENCAO CRITICA: Voce DEVE responder APENAS com um objeto JSON valido. Sem markdown. Sem \`\`\`json. Sem texto antes ou depois. Apenas o objeto JSON puro, comecando com { e terminando com }.

Sua TAREFA NESSA ETAPA: ler a copy de uma pagina de vendas e DETECTAR (sem validar ainda):
1. Que tipo de pagina e essa: principal (publico frio) ou remarketing (publico quente)?
2. Quem e o publico-alvo dessa pagina especifica?

DEFINICOES DOS TIPOS:

PAGINA PRINCIPAL (publico frio): pagina longa, completa, com quebra progressiva de objecao. Para trafego que NUNCA ouviu falar do expert ou do produto. Tem todas estas secoes esperadas: promessa, caminho, identificacao, conteudo do evento, cronograma, cases imagem, preco, cases video, sobre, garantia, FAQ.

PAGINA DE REMARKETING (publico quente): pagina curta, direta, focada em decisao. Para quem JA conhece o expert/oferta. Tem secoes: promessa complementar, cases volume, conteudo, cronograma, preco, mais cases, "por que tao barato?", garantia, certificado, last CTA.

SINAIS QUE INDICAM PAGINA PRINCIPAL:
- Bio extensa do expert ("Sobre" detalhado)
- Filtro de publico explicito ("isso e pra voce se...")
- Argumentacao do "como" o metodo funciona
- FAQ com varias perguntas
- Garantia detalhada

SINAIS QUE INDICAM REMARKETING:
- Texto curto, direto na oferta
- Bio do expert minima ou ausente
- Foco em volume de cases
- Secao "por que tao barato"
- Recapitulacao da oferta no final

REGRAS DE DETECCAO:
- Para o publico, infira: nivel de consciencia (frio/morno/quente), nicho/area, caracteristica diferencial.
- Se algo for AMBIGUO ou nao puder ser inferido com seguranca, gere PERGUNTAS curtas com opcoes para o usuario responder.
- Cite EVIDENCIA do texto que sustenta cada deteccao.
- Seja DIRETO. Nao invente o que nao tem na copy.

FORMATO DE RESPOSTA (JSON):

{
  "tipoPagina": {
    "valor": "principal" | "remarketing",
    "confianca": "alta" | "media" | "baixa",
    "evidencia": "trecho ou observacao especifica que sustenta a deteccao"
  },
  "publico": {
    "consciencia": "frio" | "morno" | "quente",
    "consciencia_evidencia": "trecho ou observacao",
    "nicho": "descricao curta do nicho/area do publico",
    "nicho_evidencia": "trecho ou observacao",
    "caracteristica": "caracteristica diferencial do publico (anos de experiencia, momento de carreira, etc)",
    "caracteristica_evidencia": "trecho ou observacao"
  },
  "duvidas": [
    {
      "id": "tipo_pagina" | "consciencia" | "nicho" | "caracteristica",
      "pergunta": "pergunta curta para o usuario",
      "opcoes": ["opcao 1", "opcao 2", "opcao 3"]
    }
  ]
}

REGRAS PARA DUVIDAS:
- "duvidas" so aparece se voce realmente tiver duvida em algum ponto.
- Se nao tiver duvida em NENHUM ponto, devolva "duvidas": [].
- Cada duvida deve ter de 2 a 4 opcoes objetivas (nao genericas tipo "outro").
- Para campos de "publico" sobre os quais voce tem duvida pequena, ainda assim PREENCHA o melhor que puder, mas adicione na lista de duvidas para o usuario confirmar.
- Tenha duvida facilmente. Pequenas duvidas sao normais. Grandes duvidas exigem que voce nao chute.

LEMBRE: Devolva APENAS o JSON puro. Nada antes. Nada depois.`;

  const userMessage = `Analise esta copy de pagina de vendas e DETECTE (nao valide ainda) o tipo de pagina e o publico:

"""
${conteudo.trim()}
"""

Devolva o JSON com a deteccao.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro Groq:', response.status, errText);
      return res.status(500).json({ error: 'Erro ao chamar a API do Groq.', detail: errText });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    let jsonText = rawText.trim();
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('Falha ao parsear JSON. Resposta bruta:', rawText);
      return res.status(500).json({ error: 'A IA devolveu formato inesperado. Tente novamente.', raw: rawText });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro inesperado no servidor.', detail: String(err) });
  }
}
