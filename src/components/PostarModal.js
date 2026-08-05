"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { redimensionarImagem } from "@/lib/imagem";

export default function PostarModal({ visivel, onClose, sessionUserId, onPostado }) {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [legenda, setLegenda] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

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
    onClose();
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
      if (preview) URL.revokeObjectURL(preview);
      setArquivo(null);
      setPreview("");
      setLegenda("");
      onPostado(data);
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

        {erro && <p className="text-xs text-red-400 mb-3">{erro}</p>}

        <button
          onClick={postar}
          disabled={enviando || !arquivo}
          className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
        >
          {enviando ? "Publicando..." : "Postar"}
        </button>
      </div>
    </div>
  );
}
