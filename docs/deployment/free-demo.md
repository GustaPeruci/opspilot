# OpsPilot — demonstração gratuita

A demonstração estática em `docs/preview` usa Forge CSS, dados fictícios e JavaScript sem servidor. Ela permite criar tarefas, buscar, filtrar, iniciar, concluir e cancelar. O estado é salvo em `localStorage` no navegador; pode ser restaurado em **Workspace → Restaurar dados fictícios**.

- Custo de infraestrutura: zero, usando GitHub Pages (sujeito aos limites do GitHub).
- Não requer credenciais, PostgreSQL, API ou conta de visitante.
- Não existe sincronização entre navegadores nem autenticação nesta demonstração.
- Não inserir dados reais ou sensíveis. Limpar dados do navegador remove o estado.
- O aplicativo completo Next.js/NestJS/PostgreSQL continua no repositório, mas **não está implantado em produção**.
- A publicação automática depende de GitHub Pages estar habilitado em Settings → Pages com **Source: GitHub Actions**. O workflow `.github/workflows/pages.yml` publica alterações em `docs/preview`.

URL esperada quando o Pages estiver habilitado: https://gustaperuci.github.io/opspilot/

Para evoluir para SaaS público com backend e banco, será necessário escolher e validar provedores com cotas gratuitas disponíveis, políticas de suspensão e limites de armazenamento. Não confundir a demo local com um ambiente multi-tenant.
