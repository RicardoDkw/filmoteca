"use client";

import { useEffect, useState } from "react";
import { Bell, User, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatarTempoRelativo } from "@/lib/tempo";

export default function NotificacoesModal({ visivel, onClose, sessionUserId, onAbrirFilme }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [perfisAutores, setPerfisAutores] = useState({});
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase
      .from("notificacoes")
      .select("*")
      .eq("destinatario_id", sessionUserId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(async ({ data, error }) => {
        if (!ativo) return;
        setCarregando(false);
        if (error) {
          console.error("Erro ao carregar notificações:", error);
          return;
        }
        const lista = data || [];
        setNotificacoes(lista);
        const idsFaltando = [...new Set(lista.map((n) => n.autor_id))];
        if (idsFaltando.length === 0) return;
        const { data: perfisData, error: erroPerfis } = await supabase
          .from("perfis")
          .select("user_id, nick, nome, avatar_url")
          .in("user_id", idsFaltando);
        if (!ativo) return;
        if (erroPerfis) {
          console.error("Erro ao carregar perfis dos autores das notificações:", erroPerfis);
          return;
        }
        const mapa = {};
        for (const p of perfisData || []) mapa[p.user_id] = p;
        setPerfisAutores(mapa);
      });
    return () => {
      ativo = false;
    };
  }, [sessionUserId]);

  async function marcarComoLida(id) {
    setNotificacoes((atual) => atual.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }

  async function marcarTodasComoLidas() {
    if (marcandoTodas) return;
    const idsNaoLidas = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (idsNaoLidas.length === 0) return;
    setMarcandoTodas(true);
    const { error } = await supabase.from("notificacoes").update({ lida: true }).in("id", idsNaoLidas);
    setMarcandoTodas(false);
    if (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      alert("Não foi possível marcar todas como lidas. Tente novamente.");
      return;
    }
    setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })));
  }

  async function clicarNotificacao(n) {
    if (!n.lida) {
      marcarComoLida(n.id);
    }
    onClose();
    onAbrirFilme(n.filme_id, n.destinatario_id);
  }

  const temNaoLidas = notificacoes.some((n) => !n.lida);

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
          <h2 className="text-xl font-bold">Notificações</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        {temNaoLidas && (
          <button
            onClick={marcarTodasComoLidas}
            disabled={marcandoTodas}
            className="text-xs text-[#D97757] hover:text-[#e5896d] transition mb-3 disabled:opacity-60"
          >
            {marcandoTodas ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        )}

        {carregando ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
            <span className="text-xs text-[#8A857C]">Carregando...</span>
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-8 h-8 text-[#8A857C] mb-2" />
            <p className="text-[#8A857C] text-sm">Nenhuma notificação ainda.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {notificacoes.map((n) => {
              const autor = perfisAutores[n.autor_id];
              return (
                <button
                  key={n.id}
                  onClick={() => clicarNotificacao(n)}
                  className={`w-full text-left flex items-start gap-2 p-3 rounded-md transition hover:border-[#D97757] border ${
                    n.lida ? "bg-[#12100E] border-[#2A2622]" : "bg-[#2A2622] border-[#3A352E]"
                  }`}
                >
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
                    <p className="text-sm">
                      <span className="font-medium">{autor?.nome || autor?.nick || "Alguém"}</span>{" "}
                      comentou em <span className="font-medium">{n.filme_titulo}</span>
                    </p>
                    <p className="text-[10px] text-[#8A857C] mt-1">
                      {formatarTempoRelativo(n.created_at)}
                    </p>
                  </div>
                  {!n.lida && (
                    <span className="w-2 h-2 rounded-full bg-[#D97757] mt-1.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
