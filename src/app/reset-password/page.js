"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Film } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const [status, setStatus] = useState("verificando"); // verificando | pronto | sem-sessao | enviando | concluido
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("pronto");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((atual) => {
        if (atual !== "verificando") return atual;
        return session ? "pronto" : "sem-sessao";
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setStatus("enviando");
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(error.message);
      setStatus("pronto");
      return;
    }
    setStatus("concluido");
  }

  return (
    <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] p-6 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Film className="w-5 h-5 text-[#D97757]" />
          <h1 className="text-2xl font-bold tracking-wide">MINHA FILMOTECA</h1>
        </div>

        <div className="bg-[#1B1815] rounded-lg p-6 border border-[#2A2622]">
          {status === "verificando" && (
            <p className="text-sm text-[#8A857C] text-center py-4">Verificando link...</p>
          )}

          {status === "sem-sessao" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-[#8A857C]">
                Link inválido ou expirado. Solicite um novo e-mail de redefinição.
              </p>
              <Link href="/" className="inline-block text-xs text-[#D97757] mt-2">
                Voltar para o login
              </Link>
            </div>
          )}

          {(status === "pronto" || status === "enviando") && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-[#8A857C] mb-1">Defina sua nova senha.</p>
              <input
                type="password"
                autoFocus
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Nova senha"
                className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
              />
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirmar nova senha"
                className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
              />
              {erro && <p className="text-xs text-red-400">{erro}</p>}
              <button
                type="submit"
                disabled={status === "enviando"}
                className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
              >
                {status === "enviando" ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}

          {status === "concluido" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-green-400">Senha redefinida com sucesso!</p>
              <Link href="/" className="inline-block text-xs text-[#D97757] mt-2">
                Ir para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
