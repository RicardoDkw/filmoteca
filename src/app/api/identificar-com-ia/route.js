import { NextResponse } from "next/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODELO = "claude-sonnet-5";
const PROMPT =
  "Identifique o filme, série ou anime dessa cena. Responda APENAS com o nome do título " +
  "(o mais reconhecível possível, em português ou no idioma original), sem explicações e " +
  "sem pontuação extra. Se não tiver certeza razoável do que é, responda exatamente: não identificado";

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY não configurada");
    return NextResponse.json(
      { error: "Identificação por IA não está disponível no momento." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
  }

  const { imagemBase64, mediaType } = body || {};
  if (!imagemBase64) {
    return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
  }

  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/jpeg",
                  data: imagemBase64,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Erro ao conectar na API da Anthropic:", err);
    return NextResponse.json(
      { error: "Não foi possível identificar com IA no momento. Tente novamente." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const detalhe = await res.json().catch(() => null);
    console.error("Erro da API da Anthropic:", res.status, detalhe);
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "Identificação por IA não está disponível no momento." },
        { status: 502 }
      );
    }
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Limite de uso da IA atingido. Tente novamente mais tarde." },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Não foi possível identificar com IA no momento. Tente novamente." },
      { status: 502 }
    );
  }

  const data = await res.json();
  const texto = (data.content || [])
    .filter((bloco) => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join(" ")
    .trim();

  if (!texto || /^n[ãa]o identificado/i.test(texto)) {
    return NextResponse.json({ encontrado: false });
  }

  return NextResponse.json({ encontrado: true, titulo: texto });
}
