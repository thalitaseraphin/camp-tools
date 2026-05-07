// api/fetch-url.js
// Faz fetch de uma URL e devolve o texto da pagina (sem HTML).
// Usado quando o usuario opta por colar URL em vez de texto.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL e obrigatoria.' });
  }

  // Validacao basica de URL
  let urlObj;
  try {
    urlObj = new URL(url.trim());
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).json({ error: 'URL precisa comecar com http:// ou https://' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'URL invalida. Confere se digitou direito.' });
  }

  try {
    const response = await fetch(urlObj.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Nao consegui acessar essa URL (status ${response.status}). A pagina pode estar protegida ou offline. Cola o texto direto no textarea.`
      });
    }

    const html = await response.text();

    if (!html || html.length < 200) {
      return res.status(400).json({
        error: 'A URL devolveu pouco conteudo. Pode ser uma pagina dinamica que carrega via JavaScript. Cola o texto direto no textarea.'
      });
    }

    // Extracao basica de texto: remove scripts, styles, tags HTML
    let texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (texto.length < 100) {
      return res.status(400).json({
        error: 'O conteudo extraido da URL ficou muito curto (provavelmente pagina dinamica via JavaScript). Cola o texto direto no textarea.'
      });
    }

    // Limita tamanho para nao explodir o contexto da IA depois
    const MAX_LENGTH = 25000;
    if (texto.length > MAX_LENGTH) {
      texto = texto.slice(0, MAX_LENGTH) + '\n\n[...texto truncado...]';
    }

    return res.status(200).json({
      texto,
      tamanho_original: html.length,
      tamanho_extraido: texto.length
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(400).json({ error: 'A URL demorou muito pra responder. Tenta de novo ou cola o texto direto.' });
    }
    console.error('Erro fetch URL:', err);
    return res.status(500).json({ error: 'Nao consegui acessar a URL. Cola o texto direto.', detail: String(err) });
  }
}
