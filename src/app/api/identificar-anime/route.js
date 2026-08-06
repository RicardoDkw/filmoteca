import { NextResponse } from "next/server";

const TRACE_MOE_URL = "https://api.trace.moe/search?anilistInfo";
const ANILIST_URL = "https://graphql.anilist.co";
// abaixo disso o resultado do trace.moe é ruído (nunca retorna "vazio", só o mais
// próximo que achou) — tratamos como "não identificado"
const SIMILARIDADE_MINIMA = 0.4;

async function buscarTituloAnilist(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        title { romaji english native }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { id: anilistId } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const title = data?.data?.Media?.title;
    return title?.romaji || title?.english || title?.native || null;
  } catch (err) {
    console.error("Erro ao buscar título no AniList:", err);
    return null;
  }
}

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
  }
  const imagem = formData.get("image");
  if (!imagem || typeof imagem === "string") {
    return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
  }

  const traceFormData = new FormData();
  traceFormData.append("image", imagem, imagem.name || "cena.jpg");

  let traceRes;
  try {
    traceRes = await fetch(TRACE_MOE_URL, { method: "POST", body: traceFormData });
  } catch (err) {
    console.error("Erro ao conectar no trace.moe:", err);
    return NextResponse.json(
      { error: "Não foi possível identificar a cena. Tente novamente." },
      { status: 502 }
    );
  }

  if (!traceRes.ok) {
    console.error("trace.moe respondeu com erro:", traceRes.status);
    return NextResponse.json(
      { error: "Não foi possível identificar a cena. Tente novamente." },
      { status: 502 }
    );
  }

  const traceData = await traceRes.json();
  if (traceData.error) {
    console.error("trace.moe retornou erro:", traceData.error);
    return NextResponse.json(
      { error: "Não foi possível identificar a cena. Tente novamente." },
      { status: 502 }
    );
  }

  const melhor = (traceData.result || [])[0];
  if (!melhor || melhor.similarity < SIMILARIDADE_MINIMA) {
    return NextResponse.json({ encontrado: false });
  }

  const anilistId = typeof melhor.anilist === "object" ? melhor.anilist.id : melhor.anilist;
  let titulo =
    (typeof melhor.anilist === "object" &&
      (melhor.anilist.title?.romaji ||
        melhor.anilist.title?.english ||
        melhor.anilist.title?.native)) ||
    null;

  if (!titulo && anilistId) {
    titulo = await buscarTituloAnilist(anilistId);
  }

  if (!titulo) {
    return NextResponse.json({ encontrado: false });
  }

  return NextResponse.json({
    encontrado: true,
    titulo,
    anilistId,
    similaridade: melhor.similarity,
  });
}
