# Laboratório de Páginas

Validador de páginas de vendas com IA, baseado na metodologia de Lançamentos Pagos do Willian Baldan (Rise).

> Esta é a primeira ferramenta do **Camp Tools**. A Big Idea será integrada como segunda ferramenta na próxima etapa.

## Estrutura

	.
	├── api/
	│   └── analyze-pagina.js     # Vercel Function (backend, protege a chave da API)
	├── laboratorio/
	│   ├── index.html             # Página principal do validador
	│   ├── app.js                 # Lógica do frontend
	│   └── metodologia.html       # Página explicando a metodologia
	├── package.json
	├── vercel.json                # Configuração de rewrites
	└── README.md

## Como subir na Vercel

### Passo 1 — Criar repositório no GitHub
1. Cria um repositório novo no GitHub (sugestão de nome: `laboratorio-paginas` ou `camp-tools`)
2. Sobe todos os arquivos desta pasta pra esse repo

### Passo 2 — Deploy na Vercel
1. Entra em [vercel.com](https://vercel.com), faz login com GitHub
2. Clica em **Add New → Project**
3. Importa o repositório que você criou
4. **Antes de clicar em Deploy**, clica em **Environment Variables** e adiciona:
   5. **Name**: `ANTHROPIC_API_KEY`
   6. **Value**: sua chave da Anthropic (a mesma que você usa na Big Idea)
5. Clica em **Deploy**

### Passo 3 — Acessar
Depois do deploy, a Vercel te dá uma URL tipo `seu-projeto.vercel.app`. Acessa:
- **Validador**: `seu-projeto.vercel.app/laboratorio/`
- **Metodologia**: `seu-projeto.vercel.app/laboratorio/metodologia.html`

## Sobre o modelo usado

A Vercel Function chama o modelo `claude-sonnet-4-5` da Anthropic. Se quiser trocar pra outro modelo, edita a linha `model: 'claude-sonnet-4-5'` em `api/analyze-pagina.js`.

## Próximos passos (depois deste primeiro teste)

- [ ] Testar a ferramenta com uma página real (sugestão: a página do Kácio que estamos construindo)
- [ ] Ajustar prompt do backend conforme feedback dos primeiros testes
- [ ] Integrar a Big Idea como segunda ferramenta do Camp Tools
- [ ] Criar landing do Camp Tools listando as ferramentas
- [ ] Adicionar histórico de validações (localStorage, igual à Big Idea)

## Custos esperados

Cada validação consome em torno de 5-8k tokens de input + 2-3k tokens de output. No modelo Sonnet 4.5, isso fica em torno de **R$ 0,30 a R$ 0,50 por validação**. Pra uso interno do time, é desprezível.

## Suporte

Se algo quebrar, verifica:
1. Variável `ANTHROPIC_API_KEY` foi configurada na Vercel? (Settings → Environment Variables)
2. O modelo `claude-sonnet-4-5` ainda está disponível? (Pode mudar o nome se Anthropic atualizar)
3. O Vercel Function está rodando? (Functions logs na dashboard da Vercel)
