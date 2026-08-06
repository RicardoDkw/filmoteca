"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { redimensionarImagem } from "@/lib/imagem";

export default function PostarModal({ visivel, onClose, sessionUserId, accessToken, onPostado }) {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [legenda, setLegenda] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [buscaNickMarcar, setBuscaNickMarcar] = useState("");
  const [buscandoMarcar, setBuscandoMarcar] = useState(false);
  const [erroBuscaMarcar, setErroBuscaMarcar] = useState("");
  const [marcados, setMarcados] = useState([]);

  function handleArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro("");
    if (preview) URL.revokeObjectURL(preview);
    setArquivo(file);
    setPreview(URL.createObjectURL(file));
  }

  function fechar() {
    if (enviando) return;
    if (preview) URL.revokeObjectURL(preview);
    setArquivo(null);
    setPreview("");
    setLegenda("");
    setErro("");
    setBuscaNickMarcar("");
    setErroBuscaMarcar("");
    setMarcados([]);
    onClose();
  }

  async function adicionarMarcado() {
    if (buscandoMarcar) return;
    const nick = buscaNickMarcar.trim();
    if (!nick) {
      setErroBuscaMarcar("Informe um nick.");
      return;
    }
    setErroBuscaMarcar("");
    setBuscandoMarcar(true);
    const res = await fetch("/api/buscar-por-nick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ nick }),
    });
    const data = await res.json();
    setBuscandoMarcar(false);
    if (!res.ok) {
      if (res.status === 404) {
        setErroBuscaMarcar("Usuário não encontrado.");
      } else if (res.status === 401) {
        setErroBuscaMarcar("Sua sessão expirou. Atualize a página e faça login novamente.");
      } else {
        console.error("Erro ao buscar por nick:", res.status, data);
        setErroBuscaMarcar("Não foi possível buscar o usuário. Tente novamente.");
      }
      return;
    }
    const perfilEncontrado = data.perfil;
    if (perfilEncontrado.user_id === sessionUserId) {
      setErroBuscaMarcar("Você não pode se marcar.");
      return;
    }
    if (marcados.some((m) => m.user_id === perfilEncontrado.user_id)) {
      setErroBuscaMarcar("Essa pessoa já foi marcada.");
      return;
    }
    setMarcados((atual) => [...atual, perfilEncontrado]);
    setBuscaNickMarcar("");
  }

  function removerMarcado(userId) {
    setMarcados((atual) => atual.filter((m) => m.user_id !== userId));
  }

  async function postar() {
    if (enviando || !arquivo) return;
    setErro("");
    setEnviando(true);
    try {
      const blob = await redimensionarImagem(arquivo, 1080);
      const caminho = `${sessionUserId}/${Date.now()}.jpg`;
      const { error: erroUpload } = await supabase.storage
        .from("posts")
        .upload(caminho, blob, { contentType: "image/jpeg" });
      if (erroUpload) throw erroUpload;
      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(caminho);
      const { data, error } = await supabase
        .from("posts")
        .insert({
          autor_id: sessionUserId,
          imagem_url: urlData.publicUrl,
          legenda: legenda.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (marcados.length > 0) {
        const { error: erroMarcacoes } = await supabase
          .from("marcacoes_post")
          .insert(marcados.map((m) => ({ post_id: data.id, usuario_id: m.user_id })));
        if (erroMarcacoes) {
          console.error("Erro ao marcar pessoas no post:", erroMarcacoes);
        } else {
          const { error: erroNotificacoes } = await supabase.from("notificacoes").insert(
            marcados.map((m) => ({
              destinatario_id: m.user_id,
              autor_id: sessionUserId,
              tipo: "marcacao_post",
              post_id: data.id,
            }))
          );
          if (erroNotificacoes) {
            console.error("Erro ao criar notificações de marcação:", erroNotificacoes);
          }
        }
      }

      const marcadosPublicados = marcados;
      if (preview) URL.revokeObjectURL(preview);
      setArquivo(null);
      setPreview("");
      setLegenda("");
      setBuscaNickMarcar("");
      setMarcados([]);
      onPostado(data, marcadosPublicados);
    } catch (err) {
      console.error("Erro ao publicar post:", err);
      setErro("Não foi possível publicar. Tente novamente.");
    }
    setEnviando(false);
  }

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Nova publicação</h2>
          <button onClick={fechar} disabled={enviando}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        {!preview ? (
          <label className="flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-dashed border-[#2A2622] hover:border-[#D97757] transition cursor-pointer mb-4">
            <Camera className="w-8 h-8 text-[#8A857C]" />
            <span className="text-sm text-[#8A857C]">Escolher foto</span>
            <input type="file" accept="image/*" onChange={handleArquivo} className="hidden" />
          </label>
        ) : (
          <div className="mb-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full aspect-square object-cover rounded-lg mb-2"
            />
            <label className="text-xs text-[#D97757] hover:text-[#e5896d] transition cursor-pointer">
              Trocar foto
              <input type="file" accept="image/*" onChange={handleArquivo} className="hidden" />
            </label>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="text-xs text-[#8A857C]">Legenda (opcional)</label>
          <span className="text-[10px] text-[#8A857C]">{legenda.length}/280</span>
        </div>
        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value.slice(0, 280))}
          maxLength={280}
          rows={3}
          disabled={enviando}
          placeholder="Escreva uma legenda..."
          className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 mt-1 mb-4 text-sm focus:outline-none focus:border-[#D97757] resize-none disabled:opacity-60"
        />

        <label className="text-xs text-[#8A857C]">Marcar pessoas (opcional)</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={buscaNickMarcar}
            onChange={(e) => setBuscaNickMarcar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") adicionarMarcado();
            }}
            disabled={enviando}
            placeholder="Nick da pessoa"
            className="flex-1 bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757] disabled:opacity-60"
          />
          <button
            onClick={adicionarMarcado}
            disabled={buscandoMarcar || enviando}
            className="px-4 text-sm font-medium rounded-lg bg-[#2A2622] text-[#F1EEE6] hover:bg-[#3A352E] transition disabled:opacity-60"
          >
            {buscandoMarcar ? "Buscando..." : "Adicionar"}
          </button>
        </div>
        {erroBuscaMarcar && <p className="text-xs text-red-400 mt-1.5">{erroBuscaMarcar}</p>}

        {marcados.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {marcados.map((m) => (
              <span
                key={m.user_id}
                className="flex items-center gap-1 bg-[#12100E] border border-[#2A2622] rounded-full pl-2.5 pr-1.5 py-1 text-xs"
              >
                @{m.nick}
                <button
                  onClick={() => removerMarcado(m.user_id)}
                  disabled={enviando}
                  aria-label={`Remover marcação de ${m.nick}`}
                  className="text-[#8A857C] hover:text-red-400 transition disabled:opacity-60"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {erro && <p className="text-xs text-red-400 mt-3 mb-3">{erro}</p>}

        <button
          onClick={postar}
          disabled={enviando || !arquivo}
          className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60 mt-4"
        >
          {enviando ? "Publicando..." : "Postar"}
        </button>
      </div>
    </div>
  );
}
