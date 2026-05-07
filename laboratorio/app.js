// app.js - Laboratorio de Paginas
// Logica do frontend: captura inputs, chama /api/analyze-pagina, renderiza resultado.

// ============================================================
// ESTADO E CONFIG (espelha as pontes para mostrar pergunta na secao)
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

const DESCRICOES_TIPO = {
  principal: 'Estrutura completa para tráfego frio. Long copy com quebra de objeções progressiva.',
  remarketing: 'Estrutura curta e direta para quem já conhece a oferta. Foco em volume de prova e decisão.'
};

const LOADING_MESSAGES = [
  'Lendo seções da página...',
  'Avaliando coerência narrativa...',
  'Detectando vícios de linguagem de IA...',
  'Medindo carga cognitiva...',
  'Calibrando o veredito final...'
];

let estadoAtual = {
  tipo: 'principal',
  conteudo: '',
  publico: { consciencia: 'frio', nicho: '', caracteristica: '' },
  carregando: false,
  resultado: null
};

// ============================================================
// SELECTORS
// ============================================================
const $ = (id) => document.getElementById(id);
const elBtnPrincipal = $('btn-principal');
const elBtnRemarketing = $('btn-remarketing');
const elTipoDescricao = $('tipo-descricao');
const elConteudo = $('conteudo');
const elCharCount = $('char-count');
const elBtnValidar = $('btn-validar');
const elBtnLimpar = $('btn-limpar');
const elLoadingArea = $('loading-area');
const elLoadingMsg = $('loading-msg');
const elErro = $('erro');
const elResultado = $('resultado');
const elPublicoConsciencia = $('publico-consciencia');
const elPublicoNicho = $('publico-nicho');
const elPublicoCaracteristica = $('publico-caracteristica');

// ============================================================
// EVENT LISTENERS
// ============================================================

elBtnPrincipal.addEventListener('click', () => selecionarTipo('principal'));
elBtnRemarketing.addEventListener('click', () => selecionarTipo('remarketing'));

elConteudo.addEventListener('input', () => {
  estadoAtual.conteudo = elConteudo.value;
  atualizarCharCount();
  atualizarBtnValidar();
});

elPublicoConsciencia.addEventListener('change', (e) => {
  estadoAtual.publico.consciencia = e.target.value;
});
elPublicoNicho.addEventListener('input', (e) => {
  estadoAtual.publico.nicho = e.target.value;
});
elPublicoCaracteristica.addEventListener('input', (e) => {
  estadoAtual.publico.caracteristica = e.target.value;
});

elBtnValidar.addEventListener('click', validar);
elBtnLimpar.addEventListener('click', limpar);

// ============================================================
// FUNCOES AUXILIARES
// ============================================================

function selecionarTipo(tipo) {
  estadoAtual.tipo = tipo;
  if (tipo === 'principal') {
    elBtnPrincipal.classList.add('ativo');
    elBtnRemarketing.classList.remove('ativo');
  } else {
    elBtnPrincipal.classList.remove('ativo');
    elBtnRemarketing.classList.add('ativo');
  }
  elTipoDescricao.textContent = DESCRICOES_TIPO[tipo];

  // Limpa resultado se trocar de tipo apos validar
  if (estadoAtual.resultado) {
    limpar();
  }
}

function atualizarCharCount() {
  const c = elConteudo.value;
  const palavras = c.trim().split(/\s+/).filter(Boolean).length;
  elCharCount.textContent = `${c.length} caracteres · ${palavras} palavras`;
}

function atualizarBtnValidar() {
  const tem = estadoAtual.conteudo.trim().length >= 100;
  elBtnValidar.disabled = !tem || estadoAtual.carregando;
  elBtnLimpar.classList.toggle('hidden', !estadoAtual.conteudo && !estadoAtual.resultado);
}

function mostrarErro(msg) {
  elErro.textContent = msg;
  elErro.classList.remove('hidden');
}

function ocultarErro() {
  elErro.classList.add('hidden');
}

function limpar() {
  estadoAtual.conteudo = '';
  estadoAtual.resultado = null;
  elConteudo.value = '';
  elPublicoNicho.value = '';
  elPublicoCaracteristica.value = '';
  estadoAtual.publico = { consciencia: 'frio', nicho: '', caracteristica: '' };
  elPublicoConsciencia.value = 'frio';
  elResultado.classList.add('hidden');
  elResultado.innerHTML = '';
  ocultarErro();
  atualizarCharCount();
  atualizarBtnValidar();
}

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

// ============================================================
// LOADING ROTATIVO
// ============================================================

let loadingInterval = null;
function iniciarLoading() {
  elLoadingArea.classList.remove('hidden');
  elBtnValidar.innerHTML = '<span class="spinner"></span> ANALISANDO...';
  elBtnValidar.disabled = true;
  let i = 0;
  elLoadingMsg.textContent = LOADING_MESSAGES[0];
  loadingInterval = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    elLoadingMsg.textContent = LOADING_MESSAGES[i];
  }, 2200);
}
function pararLoading() {
  if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
  elLoadingArea.classList.add('hidden');
  elBtnValidar.innerHTML = 'VALIDAR PÁGINA';
  atualizarBtnValidar();
}

// ============================================================
// VALIDAR (FETCH DA API)
// ============================================================

async function validar() {
  if (estadoAtual.carregando) return;
  ocultarErro();
  elResultado.classList.add('hidden');
  elResultado.innerHTML = '';
  estadoAtual.carregando = true;
  iniciarLoading();

  try {
    const resp = await fetch('/api/analyze-pagina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoPagina: estadoAtual.tipo,
        conteudo: estadoAtual.conteudo,
        publico: estadoAtual.publico
      })
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `Erro ${resp.status}`);
    }

    const data = await resp.json();
    estadoAtual.resultado = data;
    renderizarResultado(data);
  } catch (err) {
    console.error(err);
    mostrarErro(`Não rolou: ${err.message}. Tenta de novo. Se persistir, verifica se o conteúdo tem texto suficiente (mínimo 100 caracteres).`);
  } finally {
    estadoAtual.carregando = false;
    pararLoading();
  }
}

// ============================================================
// RENDER DO RESULTADO
// ============================================================

function renderizarResultado(data) {
  const cfg = data.config;
  const pontes = PONTES_CONFIG[estadoAtual.tipo];

  let html = '';

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
          <div class="subscore-row">
            <div class="subscore-label">ESTRUTURA</div>
            <div class="subscore-valor">${data.pontos_estrutura.toFixed(2)}<span class="denom">/4</span></div>
            <div class="subscore-bar"><div class="subscore-bar-fill" style="width: ${(data.pontos_estrutura / 4) * 100}%"></div></div>
          </div>
          <div class="subscore-row">
            <div class="subscore-label">COERÊNCIA NARRATIVA</div>
            <div class="subscore-valor">${data.pontos_coerencia.toFixed(2)}<span class="denom">/4</span></div>
            <div class="subscore-bar"><div class="subscore-bar-fill" style="width: ${(data.pontos_coerencia / 4) * 100}%"></div></div>
          </div>
          <div class="subscore-row">
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

  // ========== DIAGRAMA LINEAR DE PONTES (REFORCO C) ==========
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

  // ========== QUALIDADE DE COPY (NOVA) ==========
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
    <div class="secoes-list">`;

  data.secoes.forEach((s, idx) => {
    const secaoCfg = cfg.secoes.find(c => c.id === s.id);
    if (!secaoCfg) return;
    const peso = pesoSecaoExibido(s.status, cfg);

    // Pergunta que essa secao precisa abrir (ponte que sai dela) - REFORCO A
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

  // ========== COERENCIA NARRATIVA (PONTES) ==========
  html += `<div class="section anim-fade">
    <div class="section-label">COERÊNCIA NARRATIVA · ${data.pontes.length} PONTES</div>
    <div class="secoes-list">`;

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
  elResultado.classList.remove('hidden');
  setTimeout(() => elResultado.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

// ============================================================
// TOGGLE EXPANDIR/COLAPSAR
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
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Init
atualizarCharCount();
atualizarBtnValidar();
