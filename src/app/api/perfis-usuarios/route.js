import { NextResponse } from "next/server";
import { supabaseAdmin, usuarioAutenticado } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const chamador = await usuarioAutenticado(request);
  if (!chamador) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { userIds } = await request.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ usuarios: [] });
  }

  const usuarios = await Promise.all(
    userIds.map(async (id) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
      if (error || !data?.user) return null;
      return { id: data.user.id, email: data.user.email };
    })
  );

  return NextResponse.json({ usuarios: usuarios.filter(Boolean) });
}
