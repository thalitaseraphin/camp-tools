# Laboratório de Páginas

Validador de páginas de vendas com IA, baseado na metodologia de Lançamentos Pagos do Willian Baldan (Rise).

> Esta é a primeira ferramenta do **Camp Tools**. A Big Idea será integrada como segunda ferramenta na próxima etapa.

## Estrutura

```
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
```

## Como subir na Vercel

### Passo 1 — Criar repositório no GitHub
1. Cria um repositório novo no GitHub (sugestão de nome: `laboratorio-paginas` ou `camp-tools`)
2. Sobe todos os arquivos desta pasta pra esse repo

### Passo 2 — Deploy na Vercel
1. Entra em [vercel.com](https://vercel.com), faz login com GitHub
2. Clica em **Add New → Project**
3. Importa o repositório que você criou
4. **Antes de clicar em Deploy**, clica em **Environment Variables** e adiciona:
   - **Name**: `GROQ_API_KEY`
   - **Value**: sua chave do Groq Cloud ([console.groq.com/keys](https://console.groq.com/keys))
5. Clica em **Deploy**

### Passo 3 — Acessar
Depois do deploy, a Vercel te dá uma URL tipo `seu-projeto.vercel.app`. Acessa:
- **Validador**: `seu-projeto.vercel.app/laboratorio/`
- **Metodologia**: `seu-projeto.vercel.app/laboratorio/metodologia.html`

## Sobre o modelo usado

A Vercel Function chama o modelo `llama-3.3-70b-versatile` via **Groq Cloud** (gratuito até ~14.400 requisições/dia). Se quiser trocar de modelo, edita a linha `model: 'llama-3.3-70b-versatile'` em `api/analyze-pagina.js`.

> **Nota:** Esta ferramenta usa Groq por padrão (free tier). Se no futuro quiser migrar pra Anthropic Claude, basta trocar a URL da API, headers e formato da resposta no `analyze-pagina.js`.

## Próximos passos (depois deste primeiro teste)

- [ ] Testar a ferramenta com uma página real (sugestão: a página do Kácio que estamos construindo)
- [ ] Ajustar prompt do backend conforme feedback dos primeiros testes
- [ ] Integrar a Big Idea como segunda ferramenta do Camp Tools
- [ ] Criar landing do Camp Tools listando as ferramentas
- [ ] Adicionar histórico de validações (localStorage, igual à Big Idea)

## Custos esperados

A ferramenta usa Groq Cloud (free tier). Limite gratuito: ~14.400 requisições/dia. Para uso interno do time, é mais que suficiente. **Custo: zero.**

## Suporte

Se algo quebrar, verifica:
1. Variável `GROQ_API_KEY` foi configurada na Vercel? (Settings → Environment Variables)
2. O modelo `llama-3.3-70b-versatile` ainda está disponível? (Pode mudar o nome se Groq atualizar — confere em [console.groq.com/docs/models](https://console.groq.com/docs/models))
3. O Vercel Function está rodando? (Functions logs na dashboard da Vercel)
4. Você não estourou o limite gratuito do Groq do dia? (~14.400 req/dia)
