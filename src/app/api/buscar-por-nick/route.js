import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { nick } = await request.json();
  if (!nick) {
    return NextResponse.json({ error: "Informe um nick." }, { status: 400 });
  }

  // client anon repassando o token de quem chamou, pra rodar a query como esse
  // usuário autenticado e respeitar a RLS de "perfis" (leitura pública, sem service role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );

  // escapa % e _ (curingas do ILIKE) pra comparar o nick como texto literal
  const nickEscapado = nick.trim().replace(/[%_\\]/g, (c) => `\\${c}`);

  const { data, error } = await supabase
    .from("perfis")
    .select("user_id, nick, nome, avatar_url")
    .ilike("nick", nickEscapado)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar por nick:", error);
    return NextResponse.json({ error: "Não foi possível buscar o usuário." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ perfil: data });
}
