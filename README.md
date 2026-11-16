# Nutricional 2026/2027 — controle de alimentação

Sistema pessoal de alimentação ligado aos treinos (Ironman 70.3 Panamá).
Roda como **Cloudflare Worker** ("alimentos"), e os dados ficam no **Cloudflare KV**.

- `public/index.html`: o sistema (Painel, Lançar, Refeições, Histórico, Alimentos, Ajustes)
- `src/worker.js`: a API que salva e lê os dados e busca alimentos na internet (Open Food Facts)
- `wrangler.jsonc`: configuração. O armazenamento KV (`NUTRI`) é criado sozinho na publicação

## Configuração (uma vez só)

No Worker **alimentos** → *Configurações* → *Variáveis e segredos* → **Adicionar**:
tipo **Secreto**, nome `APP_KEY`, valor = a senha do app. Depois, *Implantações* → publicar de novo.

Cada envio para a branch `main` publica sozinho.
