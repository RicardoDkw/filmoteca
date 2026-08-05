"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, User, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatarTempoRelativo } from "@/lib/tempo";

export default function ComentariosFilmeModal({
  filme,
  visivel,
  onClose,
  sessionUserId,
  perfilProprio,
  perfisConhecidos,
}) {
  const [comentarios, setComentarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [perfisAutores, setPerfisAutores] = useState({});
  const [novoComentario, setNovoComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [apagando, setApagando] = useState(null);

  const podeComentar = filme.user_id !== sessionUserId;

  useEffect(() => {
    let ativo = true;
    supabase
      .from("comentarios_filme")
      .select("*")
      .eq("filme_user_id", filme.user_id)
      .eq("filme_id", filme.id)
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (!ativo) return;
        setCarregando(false);
        if (error) {
          console.error("Erro ao carregar comentários:", error);
          return;
        }
        const lista = data || [];
        setComentarios(lista);
        const idsFaltando = [
          ...new Set(
            lista
              .map((c) => c.autor_id)
              .filter(
                (autorId) =>
                  autorId !== sessionUserId && !(perfisConhecidos && perfisConhecidos[autorId])
              )
          ),
        ];
        if (idsFaltando.length === 0) return;
        const { data: perfisData, error: erroPerfis } = await supabase
          .from("perfis")
          .select("user_id, nick, nome, avatar_url")
          .in("user_id", idsFaltando);
        if (!ativo) return;
        if (erroPerfis) {
          console.error("Erro ao carregar perfis dos autores dos comentários:", erroPerfis);
          return;
        }
        const mapa = {};
        for (const p of perfisData || []) mapa[p.user_id] = p;
        setPerfisAutores(mapa);
      });
    return () => {
      ativo = false;
    };
  }, [filme.id, filme.user_id, sessionUserId, perfisConhecidos]);

  function resolverAutor(autorId) {
    if (autorId === sessionUserId) return perfilProprio;
    return (perfisConhecidos && perfisConhecidos[autorId]) || perfisAutores[autorId] || null;
  }

  async function enviarComentario() {
    if (enviando) return;
    const texto = novoComentario.trim();
    if (!texto || texto.length > 300) return;
    setEnviando(true);
    const { data, error } = await supabase
      .from("comentarios_filme")
      .insert({
        filme_user_id: filme.user_id,
        filme_id: filme.id,
        autor_id: sessionUserId,
        mensagem: texto,
      })
      .select()
      .single();
    setEnviando(false);
    if (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Não foi possível enviar o comentário. Tente novamente.");
      return;
    }
    setComentarios((atual) => [data, ...atual]);
    setNovoComentario("");

    if (filme.user_id !== sessionUserId) {
      const { error: erroNotificacao } = await supabase.from("notificacoes").insert({
        destinatario_id: filme.user_id,
        autor_id: sessionUserId,
        filme_id: filme.id,
        filme_titulo: filme.title,
      });
      if (erroNotificacao) {
        console.error("Erro ao criar notificação:", erroNotificacao);
      }
    }
  }

  async function apagarComentario(id) {
    if (apagando) return;
    setApagando(id);
    const { error } = await supabase.from("comentarios_filme").delete().eq("id", id);
    setApagando(null);
    if (error) {
      console.error("Erro ao apagar comentário:", error);
      alert("Não foi possível apagar o comentário. Tente novamente.");
      return;
    }
    setComentarios((atual) => atual.filter((c) => c.id !== id));
  }

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-lg p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Comentários</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <img
            src={filme.poster}
            alt={filme.title}
            className="w-16 h-24 object-cover rounded shrink-0"
          />
          <div>
            <p className="font-medium">{filme.title}</p>
            <p className="text-xs text-[#8A857C]">{filme.year}</p>
            <div className="flex items-center gap-1 mt-1 text-[#D97757] font-medium text-sm">
              <Star className="w-3.5 h-3.5 fill-[#D97757]" />
              {filme.rating ?? "—"}/10
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A2622] pt-4">
          <p className="text-sm font-medium mb-3">Comentários</p>

          {podeComentar && (
            <div className="mb-4">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value.slice(0, 300))}
                maxLength={300}
                rows={2}
                disabled={enviando}
                placeholder="Deixe um comentário..."
                className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D97757] resize-none disabled:opacity-60"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#8A857C]">{novoComentario.length}/300</span>
                <button
                  onClick={enviarComentario}
                  disabled={enviando || !novoComentario.trim()}
                  className="px-4 py-1.5 text-sm font-medium rounded-md bg-[#D97757] text-[#12100E] hover:bg-[#e5896d] transition disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </div>
          )}

          {carregando ? (
            <p className="text-xs text-[#8A857C]">Carregando comentários...</p>
          ) : comentarios.length === 0 ? (
            <p className="text-xs text-[#8A857C]">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-2">
              {comentarios.map((c) => {
                const autor = resolverAutor(c.autor_id);
                const podeApagar =
                  filme.user_id === sessionUserId || c.autor_id === sessionUserId;
                return (
                  <div key={c.id} className="bg-[#12100E] border border-[#2A2622] rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <span className="w-7 h-7 rounded-full overflow-hidden bg-[#1B1815] border border-[#2A2622] flex items-center justify-center shrink-0">
                        {autor?.avatar_url ? (
                          <img
                            src={autor.avatar_url}
                            alt={autor.nick}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-[#8A857C]" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium truncate">
                            {autor?.nome || autor?.nick || "..."}
                          </p>
                          {podeApagar && (
                            <button
                              onClick={() => apagarComentario(c.id)}
                              disabled={apagando === c.id}
                              aria-label="Excluir comentário"
                              className="text-[#8A857C] hover:text-red-400 transition disabled:opacity-60 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm mt-0.5 break-words">{c.mensagem}</p>
                        <p className="text-[10px] text-[#8A857C] mt-1">
                          {formatarTempoRelativo(c.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
