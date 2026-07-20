# Branding

> Consolida os antigos `BRANDING.md`, `BRANDING_GUIDE.md`, `BRANDING_USAGE_GUIDE.md` e `LOGO_DEPLOYMENT.md`.
> Para regras de **interface** (tokens, tema dia/noite, tipografia, componentes), a fonte é [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md).
> Este documento trata apenas de **marca**: cores institucionais, logotipos e ativos.

---

## Nomenclatura

| Papel | Nome | Onde aparece |
|---|---|---|
| Empresa / marca | **Orvalho Digital** *(Orvalho Digital Tecnologia Ltda)* | logo, rodapé, suporte, documentos legais |
| Produto | **Gestor de Pátio** | telas, planos, notificações, contratos |
| Cor primária | Roxo `#5B46E5` | `--primary` em `src/index.css` |
| Domínio | `orvalhodigital.com.br` · `painel.orvalhodigital.com.br` | CORS, links, e-mails |

**Regra:** nomes de plataforma/produto na interface usam *Gestor de Pátio*; referências à empresa usam *Orvalho Digital*.

As marcas **Otimizza** e **nLeads** foram aposentadas em 2026-07-20 — ver [DECISOES-E-ROADMAP.md](DECISOES-E-ROADMAP.md). Não as reintroduza.

> ⚠️ Restam ocorrências **intencionais** de `otimizza`/`nleads` no código: caminhos de endpoints n8n em produção, guardas de logo legada em `OrvalhoLogo.tsx` e chaves de `localStorage` em migração. Estão documentadas e comentadas no próprio código. **Não as remova sem ler o porquê.**

---

## Ativos

Ficam em `src/assets/branding/logos/` e são importados por [`src/components/OrvalhoLogo.tsx`](../src/components/OrvalhoLogo.tsx):

| Arquivo | Uso |
|---|---|
| `logo-orvalho.png` | Padrão, fundos claros — variantes horizontal e vertical |
| `logo-orvalho-branca.png` | Fundos escuros (`light={true}`) |
| `simbolo-orvalho.png` | Ícone isolado (`variant="icon"`) |

Cópias soltas em `idvisual/` (raiz do repositório) **não** são servidas pela aplicação — incluem também `avatar-orvalho.png` e `favicon-orvalho.png`.

O componente `LogoRenderer` decide entre a logo do sistema e a logo enviada pelo lojista.

Em qualquer adaptação, mantenha contraste mínimo de **4.5:1**.

### Quando usar cada formato

- **Horizontal** — cabeçalhos, documentos, apresentações, redes sociais. Evite em espaços estreitos.
- **Vertical** — assinatura de e-mail, sidebar, espaços quadrados.
- **Ícone** — favicon, botões de ação, menus, espaços pequenos.
- **Avatar** — perfil de usuário, badges, aba do navegador.

---

## Duas logos no sistema

Não confundir:

1. **Logo do sistema** — a marca da plataforma, fixa, aparece no painel administrativo e nas telas de autenticação.
2. **Logo da empresa (lojista)** — enviada por cada tenant, aparece no site público dele. É **dado**, não ativo do repositório.

Qualquer alteração no logo do sistema afeta todos os tenants; no logo da empresa, apenas um.

---

## Código relacionado

- [`src/components/OrvalhoLogo.tsx`](../src/components/OrvalhoLogo.tsx) — componente único de logo (`OrvalhoLogo` + `LogoRenderer`). Usado por 8 telas.
- `src/components/OtimizzaBrandLogo.tsx` e `src/hooks/useBrandTheme.ts` foram **removidos** em 2026-07-20 (zero importações, resíduo da identidade amarela).
