# Combustível 70.3 — controle de alimentação

Sistema pessoal de alimentação ligado aos treinos (Ironman 70.3 Panamá).
Roda no **Cloudflare Pages**, e os dados ficam no **Cloudflare KV**.

- `public/index.html`: o sistema (Painel, Lançar, Refeições, Histórico, Alimentos, Ajustes)
- `functions/api/[[path]].js`: a API que salva e lê os dados e busca alimentos na internet (Open Food Facts)

## Como colocar no ar (uma vez só)

1. **Criar o armazenamento:** Cloudflare → *Armazenamento e bancos de dados* → *KV* → **Criar** → nome `nutri`.
2. **Criar o projeto:** *Workers e Pages* → **Criar** → aba *Pages* → **Conectar ao Git** → escolher `kledhsonhb/Alimentos`.
   - Framework: *Nenhum*
   - Comando de build: *(vazio)*
   - Diretório de saída: `public`
   - **Salvar e implantar**
3. **Ligar o armazenamento:** no projeto → *Configurações* → *Vínculos* → **Adicionar** → *Namespace KV* → nome da variável `NUTRI` → escolher `nutri`.
4. **Criar a senha:** *Configurações* → *Variáveis e segredos* → **Adicionar** → nome `APP_KEY`, tipo *Secreto*, valor = a senha que você quiser.
5. **Publicar de novo:** *Implantações* → nos "…" da última → **Tentar novamente a implantação**.

Pronto: abra o endereço `….pages.dev`, digite a senha e use. No iPhone: Safari → Compartilhar → *Adicionar à Tela de Início*.
