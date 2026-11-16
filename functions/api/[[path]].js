// API do Combustível 70.3 — roda no Cloudflare Pages Functions.
// Precisa de: vínculo KV chamado NUTRI e a variável APP_KEY (a senha do app).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const KEY_OK = /^[A-Za-z0-9_\-\/.]{1,200}$/;

export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);
  const path = [].concat(params.path || []).join("/");

  if (!env.NUTRI) return json({ error: "O armazenamento KV 'NUTRI' não está vinculado ao projeto." }, 500);
  if (!env.APP_KEY) return json({ error: "A variável APP_KEY (senha) não foi criada no projeto." }, 500);
  if (request.headers.get("x-app-key") !== env.APP_KEY) return json({ error: "Senha incorreta." }, 401);

  // Ler / gravar / apagar um documento
  if (path === "kv") {
    const key = url.searchParams.get("key") || "";
    if (!KEY_OK.test(key)) return json({ error: "Chave inválida." }, 400);
    if (request.method === "GET") return json({ value: await env.NUTRI.get(key, "json") });
    if (request.method === "PUT") {
      const body = await request.text();
      if (body.length > 1_000_000) return json({ error: "Documento grande demais." }, 413);
      try { JSON.parse(body); } catch { return json({ error: "JSON inválido." }, 400); }
      await env.NUTRI.put(key, body);
      return json({ ok: true });
    }
    if (request.method === "DELETE") { await env.NUTRI.delete(key); return json({ ok: true }); }
    return json({ error: "Método não aceito." }, 405);
  }

  // Lista os últimos documentos de um prefixo (ex.: days/)
  if (path === "list") {
    const prefix = url.searchParams.get("prefix") || "days/";
    const max = Math.min(+url.searchParams.get("max") || 90, 200);
    let keys = [], cursor;
    do {
      const r = await env.NUTRI.list({ prefix, cursor });
      keys.push(...r.keys.map((k) => k.name));
      cursor = r.list_complete ? null : r.cursor;
    } while (cursor);
    keys.sort();
    keys = keys.slice(-max);
    const values = await Promise.all(keys.map((k) => env.NUTRI.get(k, "json")));
    return json({ items: values.filter(Boolean) });
  }

  // Busca de alimentos na internet (Open Food Facts — Brasil primeiro, depois mundo)
  if (path === "busca") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
    if (!q) return json({ items: [] });
    const fields = "product_name,product_name_pt,brands,nutriments,serving_quantity,serving_size";
    const tryHost = async (host) => {
      const u = `https://${host}/cgi/search.pl?search_simple=1&action=process&json=1&page_size=20&fields=${fields}&search_terms=${encodeURIComponent(q)}`;
      try {
        const r = await fetch(u, { headers: { "User-Agent": "Combustivel703/1.0 (uso pessoal)" } });
        if (!r.ok) return [];
        const d = await r.json();
        return (d.products || []).map((p) => {
          const n = p.nutriments || {};
          const kcal = +n["energy-kcal_100g"] || (+n["energy_100g"] ? +n["energy_100g"] / 4.184 : 0);
          const nome = [p.product_name_pt || p.product_name, p.brands].filter(Boolean).join(" — ");
          return {
            nome: nome.trim(),
            k: Math.round(kcal),
            c: +(+n.carbohydrates_100g || 0).toFixed(1),
            p: +(+n.proteins_100g || 0).toFixed(1),
            g: +(+n.fat_100g || 0).toFixed(1),
            pg: +p.serving_quantity || 100,
            pn: p.serving_size || "100 g",
          };
        }).filter((i) => i.nome && i.k > 0);
      } catch { return []; }
    };
    let items = await tryHost("br.openfoodfacts.org");
    if (items.length < 3) items = items.concat(await tryHost("world.openfoodfacts.org"));
    return json({ items: items.slice(0, 20) });
  }

  return json({ error: "Rota não encontrada." }, 404);
}
