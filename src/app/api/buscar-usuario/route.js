import { NextResponse } from "next/server";
import { supabaseAdmin, usuarioAutenticado } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const chamador = await usuarioAutenticado(request);
  if (!chamador) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Informe um e-mail." }, { status: 400 });
  }

  const emailBuscado = email.trim().toLowerCase();
  const porPagina = 1000;

  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) {
      console.error("Erro ao buscar usuário:", error);
      return NextResponse.json(
        { error: "Não foi possível buscar o usuário." },
        { status: 500 }
      );
    }
    const encontrado = data.users.find(
      (u) => (u.email || "").toLowerCase() === emailBuscado
    );
    if (encontrado) {
      return NextResponse.json({ userId: encontrado.id });
    }
    if (data.users.length < porPagina) break;
  }

  return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
}
