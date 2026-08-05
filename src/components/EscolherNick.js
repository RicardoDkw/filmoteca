"use client";

import { useEffect, useState } from "react";
import { Film, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const NICK_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function EscolherNick({ session, onCriado }) {
  const [nick, setNick] = useState("");
  const [nickVerificado, setNickVerificado] = useState(null);
  const [disponivel, setDisponivel] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const formatoValido = NICK_REGEX.test(nick);
  const verificando = formatoValido && nick !== nickVerificado;

  useEffect(() => {
    if (!verificando) return;
    let ativo = true;
    const nickAtual = nick;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("user_id")
        .ilike("nick", nickAtual.replace(/[%_\\]/g, (c) => `\\${c}`))
        .maybeSingle();
      if (!ativo) return;
      if (error) {
        console.error("Erro ao verificar nick:", error);
        return;
      }
      setDisponivel(!data);
      setNickVerificado(nickAtual);
    }, 400);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificando]);

  async function confirmar(e) {
    e.preventDefault();
    if (salvando || !formatoValido || disponivel !== true) return;
    setErro("");
    setSalvando(true);
    const { data, error } = await supabase
      .from("perfis")
      .insert({ user_id: session.user.id, nick })
      .select()
      .single();
    setSalvando(false);
    if (error) {
      if (error.code === "23505") {
        setErro("Esse nick já está em uso.");
        setDisponivel(false);
      } else {
        console.error("Erro ao criar perfil:", error);
        setErro("Não foi possível salvar. Tente novamente.");
      }
      return;
    }
    onCriado(data);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#12100E] text-[#F1EEE6] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1B1815] border border-[#2A2622] flex items-center justify-center">
            <Film className="w-7 h-7 text-[#D97757]" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">Escolha seu nick</h1>
          <p className="text-sm text-[#8A857C] text-center">
            É assim que seus amigos vão te encontrar no app.
          </p>
        </div>

        <form
          onSubmit={confirmar}
          className="bg-[#1B1815] rounded-lg p-6 border border-[#2A2622]"
        >
          <input
            autoFocus
            value={nick}
            onChange={(e) => setNick(e.target.value.trim())}
            placeholder="seu_nick"
            className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
          />

          <div className="mt-2 min-h-[1rem] text-xs">
            {nick.length === 0 ? null : !formatoValido ? (
              <p className="text-[#8A857C]">
                3 a 20 caracteres: letras, números e &quot;_&quot;.
              </p>
            ) : verificando ? (
              <p className="text-[#8A857C]">Verificando...</p>
            ) : disponivel === true ? (
              <p className="flex items-center gap-1 text-green-400">
                <Check className="w-3.5 h-3.5" /> Disponível
              </p>
            ) : disponivel === false ? (
              <p className="flex items-center gap-1 text-red-400">
                <X className="w-3.5 h-3.5" /> Esse nick já está em uso.
              </p>
            ) : null}
          </div>

          {erro && <p className="text-xs text-red-400 mt-2">{erro}</p>}

          <button
            type="submit"
            disabled={salvando || !formatoValido || disponivel !== true}
            className="w-full mt-4 bg-[#D97757] text-[#12100E] font-medium py-2 rounded-md hover:bg-[#e5896d] transition disabled:opacity-40"
          >
            {salvando ? "Salvando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
