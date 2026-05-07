// app.js - Laboratorio de Paginas
// Fluxo de 3 etapas: input → confirmar deteccao → resultado

// ============================================================
// CONFIG ESTATICA (nomes das secoes/pontes para renderizar)
// ============================================================

const PONTES_CONFIG = {
  principal: [
    { de: 'promessa', para: 'caminho', pergunta: 'Como isso é possível?' },
    { de: 'caminho', para: 'identificacao', pergunta: 'Isso serve pra mim?' },
    { de: 'identificacao', para: 'conteudo_evento', pergunta: 'O que exatamente vou receber?' },
    { de: 'conteudo_evento', para: 'cronograma', pergunta: 'Quando e como vou consumir isso?' },
    { de: 'cronograma', para: 'cases_imagem', pergunta: 'Outras pessoas fizeram e funcionou?' },
    { de: 'cases_imagem', para: 'preco', pergunta: 'Quanto custa pra ter isso?' },
    { de: 'preco', para: 'cases_video', pergunta: 'Mas vale mesmo o investimento?' },
    { de: 'cases_video', para: 'sobre', pergunta: 'Quem é o cara que tá entregando isso?' },
    { de: 'sobre', para: 'garantia', pergunta: 'E se eu comprar e me arrepender?' },
    { de: 'garantia', para: 'faq', pergunta: 'Tenho mais alguma dúvida não respondida?' }
  ],
  remarketing: [
    { de: 'promessa', para: 'cases_volume', pergunta: 'Quem mais já validou isso?' },
    { de: 'cases_volume', para: 'conteudo_evento', pergunta: 'Como eles chegaram nesse resultado?' },
    { de: 'conteudo_evento', para: 'cronograma', pergunta: 'Quando isso acontece?' },
    { de: 'cronograma', para: 'preco', pergunta: 'Quanto custa?' },
    { de: 'preco', para: 'mais_cases', pergunta: 'Mais gente comprou e teve resultado?' },
    { de: 'mais_cases', para: 'por_que_barato', pergunta: 'Se é tão bom, por que tá esse preço?' },
    { de: 'por_que_barato', para: 'garantia', pergunta: 'E se mesmo assim não rolar pra mim?' },
    { de: 'garantia', para: 'certificado', pergunta: 'Tem algo concreto que levo comigo?' },
    { de: 'certificado', para: 'last_cta', pergunta: 'Tá esperando o quê pra clicar?' }
  ]
};

const NOMES_TIPO = {
  principal: 'Página Principal · Frio',
  remarketing: 'Remarketing · Quente'
};

const NOMES_CONSCIENCIA = {
  frio: 'Frio (não conhece o expert)',
  morno: 'Morno (já viu conteúdo, não comprou)',
  quente: 'Quente (segue o expert / remarketing)'
};

const LOADING_MSGS_DETECT = [
  'Lendo a página...',
  'Identificando tipo de página...',
  'Detectando o público-alvo...',
  'Avaliando o que pode ser dúvida...'
];

const LOADING_MSGS_ANALYZE = [
  'Avaliando estrutura...',
  'Conferindo coerência narrativa...',
  'Detectando vícios de linguagem de IA...',
  'Medindo carga cognitiva...',
  'Calibrando o veredito final...'
];

// ============================================================
// ESTADO
// ============================================================

let estado = {
  modoInput: 'texto', // 'texto' ou 'url'
  conteudo: '',
  url: '',
  conteudoExtraido: '', // texto extraido da URL
  deteccao: null,
  respostas: {}, // respostas do usuario para duvidas
  resultado: null,
  carregando: false
};

// ============================================================
// SELECTORS
// ============================================================
const $ = (id) => document.getElementById(id);

const elTabTexto = $('tab-texto');
const elTabUrl = $('tab-url');
const elInputTextoArea = $('input-texto-area');
const elInputUrlArea = $('input-url-area');
const elConteudo = $('conteudo');
const elUrlInput = $('url-input');
const elCharCount = $('char-count');

const elBtnDetectar = $('btn-detectar');
const elBtnLimpar1 = $('btn-limpar-1');
const elLoading1 = $('loading-1');
const elLoadingMsg1 = $('loading-msg-1');
const elErro1 = $('erro-1');

const elEtapa1 = $('etapa-1');
const elEtapa2 = $('etapa-2');
const elEtapa3 = $('etapa-3');

const elDeteccaoGrid = $('deteccao-grid');
const elDuvidasArea = $('duvidas-area');
const elBtnValidar = $('btn-validar');
const elBtnVoltar = $('btn-voltar');
const elLoading2 = $('loading-2');
const elLoadingMsg2 = $('loading-msg-2');
const elErro2 = $('erro-2');

const elResultado = $('resultado');
const elBtnNovaValidacao = $('btn-nova-validacao');

const elStep1 = $('step-1');
const elStep2 = $('step-2');
const elStep3 = $('step-3');

// ============================================================
// EVENT LISTENERS
// ============================================================

elTabTexto.addEventListener('click', () => trocarTab('texto'));
elTabUrl.addEventListener('click', () => trocarTab('url'));

elConteudo.addEventListener('input', () => {
  estado.conteudo = elConteudo.value;
  atualizarCharCount();
  atualizarBtnDetectar();
});

elUrlInput.addEventListener('input', () => {
  estado.url = elUrlInput.value;
  atualizarBtnDetectar();
});

elBtnDetectar.addEventListener('click', detectar);
elBtnLimpar1.addEventListener('click', limparTudo);
elBtnVoltar.addEventListener('click', voltarEtapa1);
elBtnValidar.addEventListener('click', validar);
elBtnNovaValidacao.addEventListener('click', limparTudo);

// ============================================================
// FUNCOES AUXILIARES
// ============================================================

function trocarTab(modo) {
  estado.modoInput = modo;
  if (modo === 'texto') {
    elTabTexto.classList.add('active');
    elTabUrl.classList.remove('active');
    elInputTextoArea.classList.remove('hidden');
    elInputUrlArea.classList.add('hidden');
  } else {
    elTabTexto.classList.remove('active');
    elTabUrl.classList.add('active');
    elInputTextoArea.classList.add('hidden');
    elInputUrlArea.classList.remove('hidden');
  }
  atualizarBtnDetectar();
  ocultarErro1();
}

function atualizarCharCount() {
  const c = elConteudo.value;
  const palavras = c.trim().split(/\s+/).filter(Boolean).length;
  elCharCount.textContent = `${c.length} caracteres · ${palavras} palavras`;
}

function atualizarBtnDetectar() {
  let pode = false;
  if (estado.modoInput === 'texto') {
    pode = estado.conteudo.trim().length >= 100;
  } else {
    pode = /^https?:\/\/.+\..+/.test(estado.url.trim());
  }
  elBtnDetectar.disabled = !pode || estado.carregando;
  elBtnLimpar1.classList.toggle('hidden', !estado.conteudo && !estado.url);
}

function avancarParaEtapa(n) {
  elEtapa1.classList.toggle('hidden', n !== 1);
  elEtapa2.classList.toggle('hidden', n !== 2);
  elEtapa3.classList.toggle('hidden', n !== 3);

  // Atualiza progress bar
  [elStep1, elStep2, elStep3].forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 === n) s.classList.add('active');
    else if (i + 1 < n) s.classList.add('done');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarErro(area, msg) {
  const el = area === 1 ? elErro1 : elErro2;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function ocultarErro1() { elErro1.classList.add('hidden'); }
function ocultarErro2() { elErro2.classList.add('hidden'); }

function limparTudo() {
  estado = {
    modoInput: estado.modoInput, conteudo: '', url: '',
    conteudoExtraido: '', deteccao: null, respostas: {},
    resultado: null, carregando: false
  };
  elConteudo.value = '';
  elUrlInput.value = '';
  elDeteccaoGrid.innerHTML = '';
  elDuvidasArea.innerHTML = '';
  elDuvidasArea.classList.add('hidden');
  elResultado.innerHTML = '';
  ocultarErro1();
  ocultarErro2();
  atualizarCharCount();
  atualizarBtnDetectar();
  avancarParaEtapa(1);
}

function voltarEtapa1() {
  ocultarErro2();
  estado.deteccao = null;
  estado.respostas = {};
  avancarParaEtapa(1);
}

// LOADING ROTATIVO
let loadingInterval = null;
function iniciarLoading(area, msgs) {
  const elLoading = area === 1 ? elLoading1 : elLoading2;
  const elMsg = area === 1 ? elLoadingMsg1 : elLoadingMsg2;
  const elBtn = area === 1 ? elBtnDetectar : elBtnValidar;

  elLoading.classList.remove('hidden');
  elBtn.innerHTML = '<span class="spinner"></span> PROCESSANDO...';
  elBtn.disabled = true;

  let i = 0;
  elMsg.textContent = msgs[0];
  loadingInterval = setInterval(() => {
    i = (i + 1) % msgs.length;
    elMsg.textContent = msgs[i];
  }, 2200);
}

function pararLoading(area) {
  if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
  const elLoading = area === 1 ? elLoading1 : elLoading2;
  const elBtn = area === 1 ? elBtnDetectar : elBtnValidar;

  elLoading.classList.add('hidden');
  if (area === 1) {
    elBtn.innerHTML = 'DETECTAR PÁGINA →';
    atualizarBtnDetectar();
  } else {
    elBtn.innerHTML = 'VALIDAR PÁGINA →';
    elBtn.disabled = false;
  }
}

// ============================================================
// ETAPA 1: DETECTAR (CHAMA /api/detect-pagina)
// ============================================================

async function detectar() {
  if (estado.carregando) return;
  ocultarErro1();
  estado.carregando = true;
  iniciarLoading(1, LOADING_MSGS_DETECT);

  try {
    let conteudoFinal = '';

    if (estado.modoInput === 'url') {
      // Primeiro: fetch da URL
      const respFetch = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: estado.url })
      });

      if (!respFetch.ok) {
        const data = await respFetch.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${respFetch.status}`);
      }

      const dataFetch = await respFetch.json();
      conteudoFinal = dataFetch.texto;
      estado.conteudoExtraido = conteudoFinal;
    } else {
      conteudoFinal = estado.conteudo;
      estado.conteudoExtraido = conteudoFinal;
    }

    // Agora: detectar tipo + publico
    const resp = await fetch('/api/detect-pagina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: conteudoFinal })
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `Erro ${resp.status}`);
    }

    const data = await resp.json();
    estado.deteccao = data;
    renderizarEtapa2(data);
    avancarParaEtapa(2);
  } catch (err) {
    console.error(err);
    mostrarErro(1, `Não rolou: ${err.message}. Tenta de novo.`);
  } finally {
    estado.carregando = false;
    pararLoading(1);
  }
}

// ============================================================
// ETAPA 2: RENDERIZAR DETECCAO + DUVIDAS
// ============================================================

function renderizarEtapa2(deteccao) {
  // Card de deteccao
  let html = '';

  // Tipo da pagina
  html += `
    <div class="deteccao-item">
      <div class="deteccao-item-label">
        TIPO DA PÁGINA
        <span class="confianca ${deteccao.tipoPagina.confianca}">${deteccao.tipoPagina.confianca.toUpperCase()}</span>
      </div>
      <div class="deteccao-item-valor">${escapeHtml(NOMES_TIPO[deteccao.tipoPagina.valor] || deteccao.tipoPagina.valor)}</div>
      <div class="deteccao-item-evidencia">"${escapeHtml(deteccao.tipoPagina.evidencia)}"</div>
    </div>
  `;

  // Nivel de consciencia
  html += `
    <div class="deteccao-item">
      <div class="deteccao-item-label">NÍVEL DE CONSCIÊNCIA</div>
      <div class="deteccao-item-valor">${escapeHtml(NOMES_CONSCIENCIA[deteccao.publico.consciencia] || deteccao.publico.consciencia)}</div>
      <div class="deteccao-item-evidencia">"${escapeHtml(deteccao.publico.consciencia_evidencia)}"</div>
    </div>
  `;

  // Nicho
  html += `
    <div class="deteccao-item">
      <div class="deteccao-item-label">NICHO / ÁREA</div>
      <div class="deteccao-item-valor">${escapeHtml(deteccao.publico.nicho)}</div>
      <div class="deteccao-item-evidencia">"${escapeHtml(deteccao.publico.nicho_evidencia)}"</div>
    </div>
  `;

  // Caracteristica
  html += `
    <div class="deteccao-item">
      <div class="deteccao-item-label">CARACTERÍSTICA DIFERENCIAL</div>
      <div class="deteccao-item-valor">${escapeHtml(deteccao.publico.caracteristica)}</div>
      <div class="deteccao-item-evidencia">"${escapeHtml(deteccao.publico.caracteristica_evidencia)}"</div>
    </div>
  `;

  elDeteccaoGrid.innerHTML = html;

  // Duvidas (se houver)
  if (deteccao.duvidas && deteccao.duvidas.length > 0) {
    let htmlD = `
      <div class="duvidas-bloco anim-fade">
        <div class="duvidas-titulo">⚠ TENHO ${deteccao.duvidas.length === 1 ? 'UMA DÚVIDA' : `${deteccao.duvidas.length} DÚVIDAS`}</div>
        <div class="duvidas-sub">Pra calibrar melhor a análise, me confirma:</div>
    `;
    deteccao.duvidas.forEach((duv, idx) => {
      htmlD += `
        <div class="duvida-item" data-duvida-idx="${idx}">
          <div class="duvida-pergunta">${escapeHtml(duv.pergunta)}</div>
          <div class="duvida-opcoes">
            ${duv.opcoes.map((opc, opcIdx) => `
              <button class="duvida-opcao" onclick="selecionarOpcao(${idx}, ${opcIdx}, '${escapeHtml(duv.id)}', '${escapeHtmlAttr(opc)}')">${escapeHtml(opc)}</button>
            `).join('')}
          </div>
        </div>
      `;
    });
    htmlD += `</div>`;
    elDuvidasArea.innerHTML = htmlD;
    elDuvidasArea.classList.remove('hidden');
    // Bloqueia o botao validar enquanto duvidas nao forem respondidas
    elBtnValidar.disabled = true;
  } else {
    elDuvidasArea.innerHTML = '';
    elDuvidasArea.classList.add('hidden');
    elBtnValidar.disabled = false;
  }
}

window.selecionarOpcao = function(duvidaIdx, opcaoIdx, duvidaId, valorOpcao) {
  // Marca a opcao selecionada visualmente
  const item = document.querySelector(`[data-duvida-idx="${duvidaIdx}"]`);
  if (item) {
    item.querySelectorAll('.duvida-opcao').forEach(b => b.classList.remove('selecionada'));
    item.querySelectorAll('.duvida-opcao')[opcaoIdx]?.classList.add('selecionada');
  }
  // Salva resposta
  estado.respostas[duvidaId] = valorOpcao;
  // Verifica se todas as duvidas foram respondidas
  const totalDuvidas = estado.deteccao.duvidas.length;
  const totalRespondidas = Object.keys(estado.respostas).length;
  elBtnValidar.disabled = totalRespondidas < totalDuvidas;
};

// ============================================================
// ETAPA 3: VALIDAR (CHAMA /api/analyze-pagina)
// ============================================================

async function validar() {
  if (estado.carregando) return;
  ocultarErro2();
  estado.carregando = true;
  iniciarLoading(2, LOADING_MSGS_ANALYZE);

  try {
    // Monta tipoPagina e publico FINAL (deteccao + respostas)
    const det = estado.deteccao;
    let tipoPagina = det.tipoPagina.valor;
    let publico = {
      consciencia: det.publico.consciencia,
      nicho: det.publico.nicho,
      caracteristica: det.publico.caracteristica
    };

    // Aplica respostas das duvidas (se o usuario corrigiu)
    if (estado.respostas.tipo_pagina) {
      const v = estado.respostas.tipo_pagina.toLowerCase();
      if (v.includes('remarketing') || v.includes('quente')) tipoPagina = 'remarketing';
      else if (v.includes('principal') || v.includes('frio')) tipoPagina = 'principal';
    }
    if (estado.respostas.consciencia) {
      const v = estado.respostas.consciencia.toLowerCase();
      if (v.includes('frio')) publico.consciencia = 'frio';
      else if (v.includes('morno')) publico.consciencia = 'morno';
      else if (v.includes('quente')) publico.consciencia = 'quente';
    }
    if (estado.respostas.nicho) publico.nicho = estado.respostas.nicho;
    if (estado.respostas.caracteristica) publico.caracteristica = estado.respostas.caracteristica;

    const resp = await fetch('/api/analyze-pagina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoPagina,
        conteudo: estado.conteudoExtraido,
        publico
      })
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `Erro ${resp.status}`);
    }

    const data = await resp.json();
    estado.resultado = data;
    renderizarResultado(data, tipoPagina, publico);
    avancarParaEtapa(3);
  } catch (err) {
    console.error(err);
    mostrarErro(2, `Não rolou: ${err.message}. Tenta de novo.`);
  } finally {
    estado.carregando = false;
    pararLoading(2);
  }
}

// ============================================================
// RENDER DO RESULTADO
// ============================================================

function corNota(nota) {
  if (nota >= 8) return 'var(--green)';
  if (nota >= 6) return 'var(--orange)';
  if (nota >= 4) return '#ff7a4d';
  return 'var(--red)';
}

function labelStatus(s) {
  if (s === 'completa') return 'COMPLETA';
  if (s === 'incompleta') return 'INCOMPLETA';
  return 'AUSENTE';
}
function labelPonte(q) {
  if (q === 'boa') return 'BEM AMARRADA';
  if (q === 'fraca') return 'FRACA';
  return 'QUEBRADA';
}
function iconeStatus(s) {
  if (s === 'completa') return '✓';
  if (s === 'incompleta') return '−';
  return '✗';
}
function setaPonte(q) {
  if (q === 'boa') return '→';
  if (q === 'fraca') return '⇢';
  return '✗';
}
function pesoSecaoExibido(s, cfg) {
  if (s === 'completa') return cfg.pesoSecao;
  if (s === 'incompleta') return cfg.pesoSecaoIncompleta;
  return 0;
}
function pesoPonteExibido(q, cfg) {
  if (q === 'boa') return cfg.pesoPonte;
  if (q === 'fraca') return cfg.pesoPonteFraca;
  return 0;
}

function renderizarResultado(data, tipoPagina, publico) {
  const cfg = data.config;
  const pontes = PONTES_CONFIG[tipoPagina];

  let html = '';

  // ========== RESUMO DETECCAO (NO TOPO DESTACADO) ==========
  html += `
    <div class="resumo-deteccao anim-fade">
      <div class="resumo-deteccao-item">
        <span class="resumo-deteccao-label">Tipo:</span>
        <span class="resumo-deteccao-valor">${escapeHtml(NOMES_TIPO[tipoPagina] || tipoPagina)}</span>
      </div>
      <div class="resumo-deteccao-item">
        <span class="resumo-deteccao-label">Consciência:</span>
        <span class="resumo-deteccao-valor">${escapeHtml(publico.consciencia)}</span>
      </div>
      <div class="resumo-deteccao-item">
        <span class="resumo-deteccao-label">Público:</span>
        <span class="resumo-deteccao-valor">${escapeHtml(publico.nicho)}${publico.caracteristica ? ' · ' + escapeHtml(publico.caracteristica) : ''}</span>
      </div>
    </div>
  `;

  // ========== CARD DE NOTA ==========
  html += `
    <div class="nota-card anim-fade">
      <div class="nota-grid">
        <div>
          <div class="nota-label">NOTA FINAL</div>
          <div class="nota-grande" style="color: ${corNota(data.nota_total)}">
            ${data.nota_total.toFixed(1)}<span class="denom">/10</span>
          </div>
        </div>
        <div class="subscores">
          <div>
            <div class="subscore-label">ESTRUTURA</div>
            <div class="subscore-valor">${data.pontos_estrutura.toFixed(2)}<span class="denom">/4</span></div>
            <div class="subscore-bar"><div class="subscore-bar-fill" style="width: ${(data.pontos_estrutura / 4) * 100}%"></div></div>
          </div>
          <div>
            <div class="subscore-label">COERÊNCIA NARRATIVA</div>
            <div class="subscore-valor">${data.pontos_coerencia.toFixed(2)}<span class="denom">/4</span></div>
            <div class="subscore-bar"><div class="subscore-bar-fill" style="width: ${(data.pontos_coerencia / 4) * 100}%"></div></div>
          </div>
          <div>
            <div class="subscore-label">QUALIDADE DE COPY</div>
            <div class="subscore-valor">${data.pontos_qualidade.toFixed(2)}<span class="denom">/2</span></div>
            <div class="subscore-bar"><div class="subscore-bar-fill" style="width: ${(data.pontos_qualidade / 2) * 100}%"></div></div>
          </div>
        </div>
      </div>
      <div class="extensao-row">
        <div class="extensao-label">EXTENSÃO</div>
        <div style="flex: 1;">
          <div class="extensao-diag" style="color: ${data.extensao.diagnostico === 'adequada' ? 'var(--green)' : 'var(--orange)'}">
            ${data.extensao.diagnostico.replace('_', ' ').toUpperCase()}
          </div>
          <div class="extensao-feedback">${escapeHtml(data.extensao.feedback)}</div>
        </div>
      </div>
    </div>
  `;

  // ========== DIAGRAMA DE PONTES ==========
  html += `<div class="diagrama-pontes anim-fade">
    <div class="diagrama-titulo">FLUXO NARRATIVO DA PÁGINA</div>
    <div class="diagrama-fluxo">`;
  cfg.secoes.forEach((s, idx) => {
    html += `<div class="diagrama-no">${escapeHtml(s.nome)}</div>`;
    if (idx < cfg.secoes.length - 1) {
      const ponteResultado = data.pontes.find(p => (p.indice ?? 0) === idx);
      const q = ponteResultado?.qualidade || 'quebrada';
      html += `<div class="diagrama-seta ${q}">${setaPonte(q)}</div>`;
    }
  });
  html += `</div></div>`;

  // ========== LEITURA CRITICA ==========
  html += `
    <div class="leitura anim-fade">
      <div class="leitura-titulo">LEITURA CRÍTICA</div>
      <div class="leitura-corpo">${escapeHtml(data.observacoes_gerais)}</div>
    </div>
  `;

  // ========== QUALIDADE DE COPY ==========
  if (data.qualidade_copy) {
    const qc = data.qualidade_copy;
    const viciosCls = qc.vicios_ia.encontrado ? 'ruim' : 'ok';
    const cargaCls = qc.carga_cognitiva.diagnostico === 'leve' ? 'ok' : (qc.carga_cognitiva.diagnostico === 'moderada' ? 'alerta' : 'ruim');

    html += `
      <div class="qualidade-card anim-fade">
        <div class="qualidade-titulo">
          <span>QUALIDADE DE COPY</span>
          <span class="qualidade-score">${qc.score}<span class="denom">/2</span></span>
        </div>

        <div class="qualidade-bloco">
          <div class="qualidade-bloco-titulo ${viciosCls}">
            ${qc.vicios_ia.encontrado ? '⚠ VÍCIOS DE LINGUAGEM DE IA DETECTADOS' : '✓ COPY SEM VÍCIOS DE IA'}
          </div>
          <div class="qualidade-feedback">${escapeHtml(qc.vicios_ia.feedback)}</div>
          ${qc.vicios_ia.exemplos && qc.vicios_ia.exemplos.length ? `
            <ul class="qualidade-exemplos">
              ${qc.vicios_ia.exemplos.map(e => `<li>"${escapeHtml(e)}"</li>`).join('')}
            </ul>
          ` : ''}
        </div>

        <div class="qualidade-bloco">
          <div class="qualidade-bloco-titulo ${cargaCls}">
            CARGA COGNITIVA: ${qc.carga_cognitiva.diagnostico.toUpperCase()}
          </div>
          <div class="qualidade-feedback">${escapeHtml(qc.carga_cognitiva.feedback)}</div>
          ${qc.carga_cognitiva.exemplos && qc.carga_cognitiva.exemplos.length ? `
            <ul class="qualidade-exemplos">
              ${qc.carga_cognitiva.exemplos.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ========== ESTRUTURA POR SECAO ==========
  html += `<div class="section anim-fade">
    <div class="section-label">ESTRUTURA · ${data.secoes.length} SEÇÕES</div>
    <div>`;

  data.secoes.forEach((s, idx) => {
    const secaoCfg = cfg.secoes.find(c => c.id === s.id);
    if (!secaoCfg) return;
    const peso = pesoSecaoExibido(s.status, cfg);
    const ponteSai = pontes.find(p => p.de === s.id);
    const perguntaAbre = ponteSai ? ponteSai.pergunta : null;

    html += `
      <div class="secao-card ${s.status}" data-secao="${s.id}">
        <div class="secao-header" onclick="toggleSecao('${s.id}')">
          <div class="secao-chevron">▶</div>
          <div class="secao-status-icon">${iconeStatus(s.status)}</div>
          <div class="secao-num">${String(idx + 1).padStart(2, '0')}</div>
          <div class="secao-nome">${escapeHtml(secaoCfg.nome)}</div>
          <span class="secao-badge">${labelStatus(s.status)}</span>
          <div class="secao-pontos">+${peso.toFixed(2)}</div>
        </div>
        <div class="secao-body">
          <div class="secao-body-bloco">
            <div class="secao-body-label">O QUE DEVE TER</div>
            <div class="secao-body-conteudo">${escapeHtml(secaoCfg.criterios_completo)}</div>
          </div>
          ${s.evidencia ? `
            <div class="secao-body-bloco">
              <div class="secao-body-label">EVIDÊNCIA NA SUA PÁGINA</div>
              <div class="secao-body-conteudo evidencia">"${escapeHtml(s.evidencia)}"</div>
            </div>
          ` : ''}
          <div class="secao-body-bloco">
            <div class="secao-body-label green">FEEDBACK</div>
            <div class="secao-body-conteudo">${escapeHtml(s.feedback)}</div>
          </div>
          ${perguntaAbre ? `
            <div class="secao-pergunta-abre">
              <strong>↳ Pergunta que essa seção abre na cabeça do lead:</strong> "${escapeHtml(perguntaAbre)}"
              <br/><span style="color: var(--text-faint); font-size: 11px;">A próxima seção precisa responder isso.</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  html += `</div></div>`;

  // ========== COERENCIA NARRATIVA ==========
  html += `<div class="section anim-fade">
    <div class="section-label">COERÊNCIA NARRATIVA · ${data.pontes.length} PONTES</div>
    <div>`;

  data.pontes.forEach((p, idx) => {
    const ponteCfg = cfg.pontes[p.indice ?? idx];
    if (!ponteCfg) return;
    const secaoDe = cfg.secoes.find(s => s.id === ponteCfg.de);
    const secaoPara = cfg.secoes.find(s => s.id === ponteCfg.para);
    if (!secaoDe || !secaoPara) return;
    const peso = pesoPonteExibido(p.qualidade, cfg);

    html += `
      <div class="ponte-card ${p.qualidade}" data-ponte="${idx}">
        <div class="ponte-header" onclick="togglePonte('${idx}')">
          <div class="ponte-status-icon"></div>
          <div class="ponte-fluxo">
            <span class="de">${escapeHtml(secaoDe.nome)}</span>
            <span class="seta">→</span>
            <span>${escapeHtml(secaoPara.nome)}</span>
          </div>
          <span class="ponte-badge">${labelPonte(p.qualidade)}</span>
          <div class="ponte-pontos">+${peso.toFixed(2)}</div>
        </div>
        <div class="ponte-body">
          <div class="ponte-body-label">PERGUNTA QUE A SEÇÃO ANTERIOR ABRE</div>
          <div class="ponte-body-conteudo italic">"${escapeHtml(ponteCfg.pergunta)}"</div>
          <div class="ponte-body-label green">FEEDBACK</div>
          <div class="ponte-body-conteudo">${escapeHtml(p.feedback)}</div>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;

  elResultado.innerHTML = html;
}

// ============================================================
// TOGGLES
// ============================================================

window.toggleSecao = (id) => {
  const card = document.querySelector(`.secao-card[data-secao="${id}"]`);
  if (card) card.classList.toggle('expandida');
};

window.togglePonte = (idx) => {
  const card = document.querySelector(`.ponte-card[data-ponte="${idx}"]`);
  if (card) card.classList.toggle('expandida');
};

// ============================================================
// HELPERS
// ============================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttr(str) {
  return escapeHtml(str).replace(/'/g, "\\'");
}

// Init
atualizarCharCount();
atualizarBtnDetectar();
