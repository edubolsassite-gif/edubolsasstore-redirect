import type { Context, Config } from "@netlify/edge-functions";

const HOME = "https://www.edubolsas.com.br/";

// referência numérica (linha EB) -> página atual no site novo
const REFS: Record<string, string> = {
  "126": "mochila-feminina-grande-edubolsas-em-couro-legitimo-com-duplo-compartimento-preto",
  "225": "mochila-media-em-couro-legitimo-com-matelasse-edubolsas-sol-nascente",
  "233": "pasta-para-notebook-em-couro-legitimo-com-detalhe-croco-edubolsas-preto-croco-preto",
  "277": "bolsa-tote-grande-edubolsas-em-couro-com-3-compartimentos-argila",
  "429": "bolsa-tiracolo-media-edubolsas-em-couro-legitimo-com-bolsos-frontais-arraia-prata",
  "430": "bolsa-tiracolo-pequena-edubolsas-em-couro-legitimo-com-bolso-frontal-vermelho-escuro",
  "446": "bolsa-tiracolo-antifurto-edubolsas-em-couro-legitimo-cacau",
  "469": "bolsa-pouch-tiracolo-edubolsas-em-couro-legitimo-com-corrente-taupe",
  "474": "edubolsas-bolsa-ombro-tresse-couro-legitimo-tassel-coral",
  "479": "edubolsas-porta-celular-matelasse-couro-corrente-erva-doce",
  "489": "bolsa-tote-media-edubolsas-em-couro-legitimo-com-alcas-trancadas-erva-doce-com-argila",
  "490": "bolsa-satchel-media-3-compartimentos-edubolsas-em-couro-legitimo-com-correntes-nude-com-algodao-doce",
  "495": "bolsa-media-camera-bag-em-couro-legitimo-com-alca-de-cadarco-edubolsas-preto",
  "510": "bolsa-tote-grande-em-couro-legitimo-com-dois-bolsos-frontais-edubolsas-preto",
  "535": "bolsa-crossbody-pequena-em-couro-legitimo-com-dois-ziperes-edubolsas-croco-off-preto",
  "539": "edubolsas-mochila-couro-legitimo-antifurto-alcas-personalizadas-atanado",
  "540": "porta-celular-edubolsas-em-couro-com-visor-touch-e-porta-cartoes-creta-nude",
  "551": "bolsa-porta-celular-edubolsas-em-couro-com-visor-touch-e-carteira-hortencia",
  "552": "bolsa-tiracolo-pequena-edubolsas-em-matelasse-com-alca-de-corrente-atanado",
  "553": "bolsa-media-edubolsas-matelasse-couro-2-alcas-atanado",
  "554": "bolsa-de-mao-estruturada-edubolsas-em-couro-com-tampa-organica-vermelho-escuro",
  "555": "bolsa-de-ombro-estruturada-edubolsas-em-couro-com-design-assimetrico-piton-off-white",
  "556": "bolsa-estruturada-edubolsas-em-couro-legitimo-com-3-divisorias-arraia-gold",
  "557": "bolsa-desestruturada-edubolsas-em-couro-com-franjas-em-camurca-preto",
  "558": "bolsa-tiracolo-edubolsas-com-tampa-e-franjas-em-camurca-e-2-alcaseb-cacau",
  "559": "bolsa-media-edubolsas-em-couro-com-tampa-de-no-manual-e-alca-de-corrente-argila",
  "560": "clutch-em-couro-edubolsas-com-no-e-corrente-argila",
  "562": "bolsa-estruturada-satchel-edubolsas-com-alca-de-mao-em-metal-creta-nude",
  "563": "bolsa-media-edubolsas-em-couro-macio-com-alca-de-no-off-white",
  "564": "bolsa-baguete-edubolsas-com-tachas-e-alca-dupla-mel",
  "565": "bolsa-de-ombro-com-tachas-couro-legitimo-havana",
  "566": "bolsa-de-ombro-grande-edubolsas-em-couro-com-tachas-3-divisorias-off-white",
  "569": "bolsa-hobo-grande-edubolsas-com-franjas-duplas-e-alca-com-regulagem-preto",
  "571": "bolsa-tiracolo-pequena-edubolsas-com-detalhe-artesanal-e-tassel-havana",
  "572": "bolsa-bucket-edubolsas-em-couro-com-detalhes-artesanais-rosa",
  "574": "bolsa-de-ombro-em-couro-edicao-limitada-edubolsas-com-pintura-manual-edicao-limitada",
  "575": "bolsa-hobo-edicao-limitada-edubolsas-com-pintura-manual-e-correntes-azul",
  "576": "bolsa-tote-estruturada-edicao-limitada-em-couro-com-pintura-manual-edicao-limitada",
  "577": "bolsa-tote-grande-de-ombro-em-couro-legitimo-edubolsas-cereja-bordo",
  "578": "bolsa-tote-media-de-ombro-em-couro-legitimo-edubolsas-preto-croco-preto",
  "579": "bolsa-tiracolo-hobo-em-couro-legitimo-edubolsas-cacau",
  "580": "bolsa-de-ombro-hobo-em-couro-legitimo-com-alca-de-no-edubolsas-bordo",
  "581": "bolsa-de-ombro-hobo-grande-em-couro-legitimo-edubolsas-castor",
  "582": "bolsa-tote-em-couro-legitimo-com-no-frontal-edubolsas-castor",
  "584": "bolsa-tote-em-couro-legitimo-com-textura-croco-edubolsas-nude-arraia-nude",
  "585": "bolsa-baguete-tiracolo-em-couro-legitimo-edubolsas-off-white-osso",
  "586": "bolsa-tiracolo-compacta-em-couro-legitimo-com-cadarco-edubolsas-castor-cacau",
  "587": "bolsa-de-mao-estruturada-em-couro-legitimo-com-alca-removivel-edubolsas-argila-tresse-fendi",
  "588": "bolsa-shoulder-bag-com-aba-e-torniquete-em-couro-legitimo-edubolsas-croco-off-off-white",
  "589": "bolsa-tote-estruturada-de-mao-em-couro-legitimo-edubolsas-croco-biscoito-atanado",
  "590": "bolsa-de-ombro-grande-em-couro-legitimo-com-nos-laterais-edubolsas-arraia-nude-nude",
  "591": "bolsa-transversal-em-couro-legitimo-edubolsas-preto",
  "592": "bolsa-transversal-baguete-compacta-em-couro-legitimo-edubolsas-castor",
  "593": "bolsa-clutch-em-couro-legitimo-com-alca-de-corrente-edubolsas-croco-off-off-white",
  "594": "bolsa-shoulder-bag-com-aba-croco-em-couro-legitimo-edubolsas-off-white-croco-off",
  "595": "bolsa-media-estruturada-em-couro-legitimo-com-alca-removivel-edubolsas-preto-croco-preto",
  "596": "bolsa-tote-de-ombro-em-couro-legitimo-com-tres-compartimentos-edubolsas-cacau-oliva",
};

// categorias antigas (Loja Integrada: /categoria/xxx.html) por palavra-chave
const CATS: Array<[RegExp, string]> = [
  [/carteira|porta-cart/, "carteira-feminina"],
  [/mochila/, "bolsas-em-couro/costas"],
  [/notebook|pasta|maleta/, "bolsas-em-couro/para-notebook"],
  [/masculin/, "linha-masculina"],
  [/mala/, "malas-de-viagem"],
  [/tiracolo|transversal|crossbody/, "bolsas-em-couro/tiracolo-e-transversal"],
  [/ombro|hobo|tote/, "bolsas-em-couro/bolsas-de-ombro"],
  [/mao|clutch|satchel/, "bolsas-em-couro/bolsas-de-mao"],
  [/acessorio|chaveiro|necessaire|porta-|batom|niquel|oculos/, "acessorios-em-couro"],
  [/bolsa|couro/, "bolsas-em-couro"],
];

function target(pathname: string): string {
  const p = decodeURIComponent(pathname).toLowerCase();
  if (p === "/" || p === "") return HOME;

  // páginas institucionais / carrinho / conta -> home
  if (/^\/(conta|carrinho|checkout|login|cadastro|busca|pagina|marca)\b/.test(p)) {
    if (/^\/pagina\/.*(quem-somos|sobre|historia)/.test(p)) return HOME + "quem-somos";
    if (/^\/pagina\/.*(troca|devolu)/.test(p)) return HOME + "politica-de-trocas-e-devolucoes";
    return HOME;
  }

  // categoria antiga
  if (p.startsWith("/categoria/")) {
    for (const [re, dest] of CATS) if (re.test(p)) return HOME + dest;
    return HOME + "bolsas-em-couro";
  }

  // produto antigo: procura referência de 3 dígitos (prefere "eb-495" / "eb495")
  const eb = p.match(/eb-?0*(\d{3})(?!\d)/);
  const nums = [...p.matchAll(/(?<![\d])(\d{3})(?![\d])/g)].map((m) => m[1]);
  const cands = eb ? [eb[1], ...nums] : nums;
  for (const n of cands) if (REFS[n]) return HOME + REFS[n];

  // sem equivalente: tenta categoria por palavra, senão home
  for (const [re, dest] of CATS) if (re.test(p)) return HOME + dest;
  return HOME;
}

// ---- Feed de inventário local para o Google Merchant Center ----
// Estoque é integrado: tudo que está disponível no site está nas 2 lojas físicas.
const FEED = "https://www.edubolsas.com.br/feed/?operation=googleshopping";
const STORES = ["13237919501666084020", "12117036976146214454"]; // Parque Shopping, Indiana (códigos do Perfil da Empresa)

async function localInventory(): Promise<Response> {
  const r = await fetch(FEED, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
      "Accept": "application/xml,text/xml,*/*",
    },
  });
  if (!r.ok) return new Response("feed indisponivel: " + r.status, { status: 502 });
  const xml = await r.text();
  const lines = ["store_code\tid\tavailability"];
  const items = xml.split(/<item>/).slice(1);
  for (const it of items) {
    const id = (it.match(/<g:id>\s*(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]?.trim();
    const av = (it.match(/<g:availability>\s*(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]?.trim() || "in_stock";
    if (!id) continue;
    const availability = /out/i.test(av) ? "out_of_stock" : "in_stock";
    for (const s of STORES) lines.push(`${s}\t${id}\t${availability}`);
  }
  return new Response(lines.join("\n") + "\n", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  if (url.pathname === "/google-inventario-local.txt") return localInventory();
  const dest = target(url.pathname);
  return new Response(null, {
    status: 301,
    headers: { Location: dest, "Cache-Control": "public, max-age=3600" },
  });
};

export const config: Config = { path: "/*" };
