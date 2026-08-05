"use client";

import { useState } from "react";
import { Check, User, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { redimensionarImagem } from "@/lib/imagem";

export default function PerfilModal({ perfil, visivel, onClose, onSalvar }) {
  const [nick, setNick] = useState(perfil.nick || "");
  const [nome, setNome] = useState(perfil.nome || "");
  const [bio, setBio] = useState(perfil.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatar_url || "");
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");

  async function handleArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro("");
    setEnviandoImagem(true);
    try {
      const blob = await redimensionarImagem(file, 400);
      const caminho = `${perfil.user_id}/avatar.jpg`;
      const { error: erroUpload } = await supabase.storage
        .from("avatars")
        .upload(caminho, blob, { upsert: true, contentType: "image/jpeg" });
      if (erroUpload) throw erroUpload;
      const { data } = supabase.storage.from("avatars").getPublicUrl(caminho);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      console.error("Erro ao enviar avatar:", err);
      setErro("Não foi possível enviar a foto. Tente novamente.");
    }
    setEnviandoImagem(false);
  }

  async function salvar(e) {
    e.preventDefault();
    if (salvando || enviandoImagem) return;
    setErro("");
    setSalvando(true);
    const { data, error } = await supabase
      .from("perfis")
      .update({ nick, nome, bio, avatar_url: avatarUrl })
      .eq("user_id", perfil.user_id)
      .select()
      .single();
    setSalvando(false);
    if (error) {
      if (error.code === "23505") {
        setErro("Esse nick já está em uso.");
      } else {
        console.error("Erro ao salvar perfil:", error);
        setErro("Não foi possível salvar. Tente novamente.");
      }
      return;
    }
    onSalvar(data);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-lg p-6 w-full max-w-sm border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Meu perfil</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#12100E] border border-[#2A2622] flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#8A857C]" />
              )}
            </div>
            <label className="text-xs text-[#D97757] hover:text-[#e5896d] transition cursor-pointer">
              {enviandoImagem ? "Enviando..." : "Trocar foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handleArquivo}
                disabled={enviandoImagem}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-xs text-[#8A857C]">Nick</label>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value.trim())}
              className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8A857C]">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#8A857C]">Bio</label>
              <span className="text-[10px] text-[#8A857C]">{bio.length}/150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              maxLength={150}
              rows={3}
              className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#D97757] resize-none"
            />
          </div>

          {erro && <p className="text-xs text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={salvando || enviandoImagem}
            className="w-full flex items-center justify-center gap-1.5 bg-[#D97757] text-[#12100E] font-medium py-2 rounded-md hover:bg-[#e5896d] transition disabled:opacity-60"
          >
            {salvando ? (
              "Salvando..."
            ) : salvo ? (
              <>
                <Check className="w-4 h-4" /> Salvo
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
