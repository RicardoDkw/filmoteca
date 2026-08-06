import { NextResponse } from "next/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODELO = "claude-sonnet-5";
const CONFIANCAS_VALIDAS = ["alta", "media", "baixa"];

const PROMPT = `Você está analisando uma cena (frame) de um filme, série ou anime enviada pelo usuário.

Primeiro, em até 3-4 linhas, descreva os elementos visuais reconhecíveis da cena: atores/personagens, cenário, estilo visual (anime, live-action, animação ocidental etc.), figurino, texto ou legendas visíveis, logotipos, ou qualquer outro detalhe que ajude a identificar a obra.

Depois dessa análise, decida o título com base SOMENTE no que você reconhece com razão suficiente. NUNCA invente ou chute um título só para dar alguma resposta — se os elementos não forem suficientes pra identificar a obra com confiança, é sempre preferível dizer que não identificou a arriscar um palpite errado.

Termine sua resposta com uma última linha contendo APENAS um objeto JSON válido (nada de texto antes ou depois nessa linha), exatamente neste formato:
{"titulo": "Nome do filme/série/anime" ou null, "confianca": "alta" | "media" | "baixa" | "nenhuma"}

Guia de confiança:
- "alta": você reconhece claramente a obra (personagem, cena ou cenário inconfundível).
- "media": acha que é essa obra, mas não tem certeza absoluta.
- "baixa": é um palpite fraco, baseado em poucos elementos.
- "nenhuma": não conseguiu identificar nada — nesse caso "titulo" deve ser null.`;

function extrairJson(texto) {
  const inicio = texto.lastIndexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim < inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

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
        max_tokens: 1024,
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
    .join("\n")
    .trim();

  const json = extrairJson(texto);
  if (
    !json ||
    typeof json.titulo !== "string" ||
    !json.titulo.trim() ||
    json.confianca === "nenhuma"
  ) {
    return NextResponse.json({ encontrado: false });
  }

  const confianca = CONFIANCAS_VALIDAS.includes(json.confianca) ? json.confianca : "baixa";

  return NextResponse.json({ encontrado: true, titulo: json.titulo.trim(), confianca });
}
