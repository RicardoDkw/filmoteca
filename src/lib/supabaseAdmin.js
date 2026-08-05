import { createClient } from "@supabase/supabase-js";

// client com a service role key — bypassa RLS. Importar SÓ em rotas de API
// (server-side), nunca em componentes client.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// valida o access token do usuário logado (evita que rotas com a service role
// key virem endpoints abertos de busca/enumeração de e-mails)
export async function usuarioAutenticado(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
