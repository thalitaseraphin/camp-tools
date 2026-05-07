// api/analyze-pagina.js
// Funcao serverless que recebe o conteudo de uma pagina de vendas + contexto do publico,
// chama a API do Claude e devolve analise completa: estrutura, coerencia narrativa e qualidade de copy.
// Baseado na metodologia de Lancamentos Pagos do Willian Baldan (Rise).

// ============================================================
// CONFIGURACAO DAS PAGINAS (estrutura espelhada do JSX original)
// ============================================================

const PAGINA_PRINCIPAL = {
  nome: 'Pagina principal (publico frio)',
  descricao: 'Estrutura completa para trafego frio. Long copy com quebra de objecoes progressiva.',
  pesoSecao: 0.36,
  pesoSecaoIncompleta: 0.18,
  pesoPonte: 0.4,
  pesoPonteFraca: 0.2,
  secoes: [
    {
      id: 'promessa',
      nome: 'Promessa',
      o_que_e: 'Headline clara e especifica do beneficio. Extensao direta do anuncio. Preco visivel na primeira dobra. Nome do metodo vem depois do beneficio.',
      criterios_completo: 'Headline especifica + beneficio claro + alinhada ao anuncio + preco/CTA na primeira dobra'
    },
    {
      id: 'caminho',
      nome: 'Caminho',
      o_que_e: 'Argumentos e provas de que a promessa e possivel. O "como" da estrategia. Logica do metodo, dados que sustentam.',
      criterios_completo: 'Racional do metodo + dados ou prova logica + quebra do ceticismo inicial'
    },
    {
      id: 'identificacao',
      nome: 'Identificacao',
      o_que_e: 'Filtro de publico. "So continue aqui se voce...". Faz o lead se reconhecer e se autoqualificar.',
      criterios_completo: 'Criterios claros de quem e o publico + autoqualificacao ativa'
    },
    {
      id: 'conteudo_evento',
      nome: 'Conteudo do evento',
      o_que_e: 'O que vai entregar, alinhado ao prometido. Foco no beneficio de cada bloco, nao em "Aula 1, Aula 2".',
      criterios_completo: 'Lista de entregas + foco em beneficios + alinhamento com a promessa'
    },
    {
      id: 'cronograma',
      nome: 'Cronograma',
      o_que_e: 'Datas, fluxo, ritmo do evento. Tangibiliza a entrega e ajuda a decisao pelo encaixe na agenda.',
      criterios_completo: 'Datas claras + duracao + estrutura temporal do evento'
    },
    {
      id: 'cases_imagem',
      nome: 'Cases (imagem)',
      o_que_e: 'Prints, screenshots, depoimentos visuais. Carga cognitiva baixa, prova rapida.',
      criterios_completo: 'Prints/screenshots reais + grifos em trechos especificos + volume suficiente'
    },
    {
      id: 'preco',
      nome: 'Preco',
      o_que_e: 'Sempre ancorado: o quanto vale vs. o quanto custa. Lotes, virada de lote, infos taxadas para ancoragem.',
      criterios_completo: 'Ancoragem de valor + estrutura de lotes + valor riscado vs valor atual'
    },
    {
      id: 'cases_video',
      nome: 'Cases (video)',
      o_que_e: 'Depoimento em video de 1 case forte. Foca em um, mas mostra que existem muitos outros.',
      criterios_completo: 'Video de case real + foco em 1 com referencia a outros + autenticidade'
    },
    {
      id: 'sobre',
      nome: 'Sobre',
      o_que_e: 'Foto real (nao IA), historia e legitimidade. Lastro: numeros, palcos, marcas. Postura de mentor.',
      criterios_completo: 'Foto real e adequada + historia + lastro com numeros/marcas/palcos'
    },
    {
      id: 'garantia',
      nome: 'Garantia',
      o_que_e: 'Remove a ultima objecao. Garantia estendida quando faz sentido com o modelo.',
      criterios_completo: 'Garantia clara + prazo definido + condicoes explicitas'
    },
    {
      id: 'faq',
      nome: 'FAQ',
      o_que_e: 'Quebra das objecoes residuais. Nao e decoracao - e onde entra a pergunta que o cara faria no DM.',
      criterios_completo: 'Perguntas reais de objecao + respostas diretas + cobertura das principais duvidas'
    }
  ],
  pontes: [
    { de: 'promessa', para: 'caminho', pergunta: 'Como isso e possivel?' },
    { de: 'caminho', para: 'identificacao', pergunta: 'Isso serve pra mim?' },
    { de: 'identificacao', para: 'conteudo_evento', pergunta: 'O que exatamente vou receber?' },
    { de: 'conteudo_evento', para: 'cronograma', pergunta: 'Quando e como vou consumir isso?' },
    { de: 'cronograma', para: 'cases_imagem', pergunta: 'Outras pessoas fizeram e funcionou?' },
    { de: 'cases_imagem', para: 'preco', pergunta: 'Quanto custa pra ter isso?' },
    { de: 'preco', para: 'cases_video', pergunta: 'Mas vale mesmo o investimento?' },
    { de: 'cases_video', para: 'sobre', pergunta: 'Quem e o cara que ta entregando isso?' },
    { de: 'sobre', para: 'garantia', pergunta: 'E se eu comprar e me arrepender?' },
    { de: 'garantia', para: 'faq', pergunta: 'Tenho mais alguma duvida nao respondida?' }
  ]
};

const PAGINA_REMARKETING = {
  nome: 'Pagina de remarketing (publico quente)',
  descricao: 'Estrutura curta e direta para quem ja conhece a oferta. Foco em volume de prova e decisao.',
  pesoSecao: 0.4,
  pesoSecaoIncompleta: 0.2,
  pesoPonte: 0.44,
  pesoPonteFraca: 0.22,
  secoes: [
    {
      id: 'promessa',
      nome: 'Promessa',
      o_que_e: 'Complementar a da pagina principal, nao igual. Pode ser mais tecnica.',
      criterios_completo: 'Headline complementar + abordagem mais tecnica + diferencial vs pagina principal'
    },
    {
      id: 'cases_volume',
      nome: 'Cases (volume)',
      o_que_e: 'Imagem ou video. O importante aqui e mostrar volume de cases, nao profundidade.',
      criterios_completo: 'Multiplos cases + foco em quantidade + variedade de perfis'
    },
    {
      id: 'conteudo_evento',
      nome: 'Conteudo do evento',
      o_que_e: 'Dar nome as tecnicas, nao focar so em promessas. Valorizar os meios.',
      criterios_completo: 'Tecnicas nomeadas + meios valorizados + especificidade tecnica'
    },
    {
      id: 'cronograma',
      nome: 'Cronograma',
      o_que_e: 'Datas, fluxo, ritmo do evento. Direto ao ponto.',
      criterios_completo: 'Datas claras + duracao + estrutura temporal'
    },
    {
      id: 'preco',
      nome: 'Preco',
      o_que_e: 'Ancorado. Lotes e urgencia real.',
      criterios_completo: 'Ancoragem + lotes + valor de referencia'
    },
    {
      id: 'mais_cases',
      nome: 'Mais cases',
      o_que_e: 'Reforco de prova social apos o preco. Mostra que muita gente ja comprou e teve resultado.',
      criterios_completo: 'Cases adicionais pos-preco + variedade + reforco de decisao'
    },
    {
      id: 'por_que_barato',
      nome: 'Por que tao barato?',
      o_que_e: 'Razao genuina do especialista entregar tanto por um valor tao baixo. Nao pode ser frase pronta.',
      criterios_completo: 'Razao real e especifica + transparencia + justificativa coerente com o modelo'
    },
    {
      id: 'garantia',
      nome: 'Garantia',
      o_que_e: 'Remove a ultima objecao.',
      criterios_completo: 'Garantia clara + prazo + condicoes'
    },
    {
      id: 'certificado',
      nome: 'Certificado',
      o_que_e: 'Tangibiliza o "depois". Faz sentido para publicos que precisam justificar o investimento.',
      criterios_completo: 'Certificado mencionado + condicoes para receber'
    },
    {
      id: 'last_cta',
      nome: 'Last CTA',
      o_que_e: 'Chamada final de fechamento. Ultima oportunidade de conversao na pagina.',
      criterios_completo: 'CTA explicito de fechamento + senso de urgencia ou recapitulacao'
    }
  ],
  pontes: [
    { de: 'promessa', para: 'cases_volume', pergunta: 'Quem mais ja validou isso?' },
    { de: 'cases_volume', para: 'conteudo_evento', pergunta: 'Como eles chegaram nesse resultado?' },
    { de: 'conteudo_evento', para: 'cronograma', pergunta: 'Quando isso acontece?' },
    { de: 'cronograma', para: 'preco', pergunta: 'Quanto custa?' },
    { de: 'preco', para: 'mais_cases', pergunta: 'Mais gente comprou e teve resultado?' },
    { de: 'mais_cases', para: 'por_que_barato', pergunta: 'Se e tao bom, por que ta esse preco?' },
    { de: 'por_que_barato', para: 'garantia', pergunta: 'E se mesmo assim nao rolar pra mim?' },
    { de: 'garantia', para: 'certificado', pergunta: 'Tem algo concreto que levo comigo?' },
    { de: 'certificado', para: 'last_cta', pergunta: 'Ta esperando o que pra clicar?' }
  ]
};

const TIPOS_PAGINA = {
  principal: PAGINA_PRINCIPAL,
  remarketing: PAGINA_REMARKETING
};

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido. Use POST.' });
  }

  const { tipoPagina, conteudo, publico } = req.body || {};

  // Validacao
  if (!tipoPagina || !TIPOS_PAGINA[tipoPagina]) {
    return res.status(400).json({ error: 'Tipo de pagina invalido. Use "principal" ou "remarketing".' });
  }
  if (!conteudo || typeof conteudo !== 'string' || conteudo.trim().length < 100) {
    return res.status(400).json({ error: 'Conteudo da pagina precisa ter ao menos 100 caracteres.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API nao configurada no servidor.' });
  }

  const config = TIPOS_PAGINA[tipoPagina];

  // Contexto do publico (Opcao C - 3 perguntas estruturadas)
  const contextoPublico = publico ? `
CONTEXTO DO PUBLICO DESTA PAGINA:
- Nivel de consciencia: ${publico.consciencia || 'nao informado'}
- Nicho/area: ${publico.nicho || 'nao informado'}
- Caracteristica diferencial: ${publico.caracteristica || 'nao informado'}

Use esse contexto para calibrar sua analise. Por exemplo: se o publico e frio puro, espere que a pagina precise quebrar mais objecoes; se e quente/remarketing, espere que va direto na decisao. Se o nicho e tecnico, espere densidade tecnica nos bullets; se e generalista, espere linguagem mais acessivel.
` : '';

  const systemPrompt = `Voce e um analista especialista em paginas de vendas para lancamentos pagos, treinado pela metodologia do Willian Baldan (Rise).

Sua tarefa e auditar uma copy/roteiro de pagina de vendas e devolver analise rigorosa em 3 dimensoes:

1. ESTRUTURA - cada secao esperada esta presente e completa, presente mas incompleta, ou ausente?
2. COERENCIA NARRATIVA - cada ponte entre secoes responde a duvida que a anterior abre?
3. QUALIDADE DE COPY - tem vicios de linguagem de IA? Tem carga cognitiva alta?

TIPO DE PAGINA: ${config.nome}
DESCRICAO: ${config.descricao}
${contextoPublico}

SECOES ESPERADAS (em ordem):
${config.secoes.map((s, i) => `${i + 1}. ${s.nome}: ${s.o_que_e}\n   Criterios para "completa": ${s.criterios_completo}`).join('\n\n')}

PONTES NARRATIVAS ESPERADAS:
${config.pontes.map((p, i) => `${i + 1}. ${config.secoes.find(s => s.id === p.de).nome} -> ${config.secoes.find(s => s.id === p.para).nome} | Pergunta que precisa ser respondida: "${p.pergunta}"`).join('\n')}

DIMENSAO 3 - QUALIDADE DE COPY (analise critica):

**Vicios de linguagem de IA** (sinais que o texto parece gerado por IA):
- Frases tipo "vamos mergulhar juntos nessa jornada", "imagine so o impacto"
- "Nao e so X, e Y" usado em rajada
- Listas excessivamente paralelas (todas as frases com mesma estrutura)
- "Em um mundo onde..."
- Adjetivos vazios em serie ("incrivel, transformador, revolucionario")
- Conectores roboticos ("Alem disso, ademais, mais ainda")
- Perguntas retoricas em rajada ("Voce ja se perguntou? Ja parou pra pensar? Ja imaginou?")
- Hiperbole sem ancoragem ("o melhor", "definitivo", "transformador" sem numero/contexto)
- Frases genericas que poderiam estar em qualquer pagina ("voce vai descobrir os segredos", "sua vida nunca mais sera a mesma")

**Carga cognitiva alta** (sinais que sangra retencao):
- Paragrafos com mais de 4 linhas seguidas
- Frases longas (acima de ~25 palavras)
- Falta de quebra entre blocos densos
- Bullets com mais de 2 linhas cada
- Excesso de subordinacao ("que" + "que" + "porque" no mesmo paragrafo)
- Densidade de informacao por secao muito alta
- Listas com 7+ itens sem agrupamento

REGRAS DE ANALISE:
- Seja rigoroso. Promessas medianas merecem "incompleta" ou "ausente", nao "completa" por gentileza.
- "completa" so quando a secao tem TUDO que os criterios pedem com evidencia clara.
- "incompleta" quando ha indicio mas falta forca (ex: tem secao mas o conteudo e raso ou generico).
- "ausente" quando a secao nao foi encontrada ou esta tao fraca que nao cumpre funcao.
- Em coerencia: "boa" so quando a transicao realmente responde a duvida; "fraca" quando responde parcialmente; "quebrada" quando ha salto narrativo.
- Em qualidade: liste vicios CONCRETOS encontrados (cite trechos), nao acusacao geral. Se nao encontrou vicios, diga isso.
- Seja direto, tecnico, sem floreio. Aponte fatos.
- Responda em portugues brasileiro.

FORMATO DE RESPOSTA:

Devolva APENAS um JSON valido (sem markdown, sem comentarios, sem texto antes ou depois):

{
  "secoes": [
    {
      "id": "promessa",
      "status": "completa" | "incompleta" | "ausente",
      "evidencia": "trecho ou descricao do que foi encontrado na pagina",
      "feedback": "feedback direto e objetivo do que esta bom e o que precisa melhorar"
    }
  ],
  "pontes": [
    {
      "indice": 0,
      "qualidade": "boa" | "fraca" | "quebrada",
      "feedback": "explicacao de como a transicao esta funcionando ou falhando"
    }
  ],
  "qualidade_copy": {
    "score": 0 | 1 | 2,
    "vicios_ia": {
      "encontrado": true | false,
      "exemplos": ["trecho exato 1", "trecho exato 2"],
      "feedback": "diagnostico direto sobre presenca ou ausencia de vicios de IA"
    },
    "carga_cognitiva": {
      "diagnostico": "leve" | "moderada" | "alta",
      "exemplos": ["trecho ou problema concreto identificado"],
      "feedback": "diagnostico direto sobre densidade e estrutura visual da copy"
    }
  },
  "extensao": {
    "diagnostico": "adequada" | "longa_demais" | "curta_demais",
    "feedback": "comentario sobre densidade e tamanho geral"
  },
  "observacoes_gerais": "leitura critica geral da pagina com tom direto, tecnico, sem enrolacao. Aponta os 2-3 pontos mais criticos pra ajustar."
}

REGRAS IMPORTANTES:
- Use o ID exato de cada secao conforme listado acima.
- Os indices das pontes comecam em 0 e seguem a ordem listada.
- score de qualidade_copy: 2 = limpo (sem vicios de IA, carga cognitiva leve), 1 = parcial (alguns vicios OU carga moderada), 0 = ruim (muitos vicios E/OU carga alta).
- Devolva APENAS o JSON. Sem markdown, sem comentarios, sem \`\`\`json.`;

  const userMessage = `Analise esta pagina de vendas:

"""
${conteudo.trim()}
"""

Devolva o JSON com analise completa de estrutura, coerencia narrativa e qualidade de copy.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro da API Anthropic:', response.status, errText);
      return res.status(500).json({ error: 'Erro ao chamar a API do Claude.', detail: errText });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    // Extrai JSON robusto
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
      return res.status(500).json({ error: 'A IA devolveu um formato inesperado. Tente novamente.', raw: rawText });
    }

    // Calcula score (4/4/2)
    let pontosEstrutura = 0;
    parsed.secoes.forEach(s => {
      if (s.status === 'completa') pontosEstrutura += config.pesoSecao;
      else if (s.status === 'incompleta') pontosEstrutura += config.pesoSecaoIncompleta;
    });

    let pontosCoerencia = 0;
    parsed.pontes.forEach(p => {
      if (p.qualidade === 'boa') pontosCoerencia += config.pesoPonte;
      else if (p.qualidade === 'fraca') pontosCoerencia += config.pesoPonteFraca;
    });

    const pontosQualidade = parsed.qualidade_copy?.score ?? 0;
    const notaTotal = pontosEstrutura + pontosCoerencia + pontosQualidade;

    // Devolve resultado completo + scores calculados + config (pra frontend renderizar)
    return res.status(200).json({
      ...parsed,
      pontos_estrutura: Math.round(pontosEstrutura * 100) / 100,
      pontos_coerencia: Math.round(pontosCoerencia * 100) / 100,
      pontos_qualidade: pontosQualidade,
      nota_total: Math.round(notaTotal * 100) / 100,
      config: {
        nome: config.nome,
        secoes: config.secoes,
        pontes: config.pontes,
        pesoSecao: config.pesoSecao,
        pesoSecaoIncompleta: config.pesoSecaoIncompleta,
        pesoPonte: config.pesoPonte,
        pesoPonteFraca: config.pesoPonteFraca
      }
    });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro inesperado no servidor.', detail: String(err) });
  }
}
