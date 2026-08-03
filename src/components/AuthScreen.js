"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthScreen() {
  const [modo, setModo] = useState("login"); // "login" | "cadastro" | "esqueci"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setCarregando(true);
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        setErro(error.message);
      } else if (!data.session) {
        setMensagem("Cadastro criado! Verifique seu e-mail para confirmar a conta.");
      }
    }
    setCarregando(false);
  }

  async function handleEsqueciSenha(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    if (!email) {
      setErro("Informe seu e-mail.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setCarregando(false);
    if (error) setErro(error.message);
    else setMensagem("Enviamos um e-mail com o link para redefinir sua senha.");
  }

  return (
    <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] p-6 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Film className="w-5 h-5 text-[#D97757]" />
          <h1 className="text-2xl font-bold tracking-wide">MINHA FILMOTECA</h1>
        </div>

        <div className="bg-[#1B1815] rounded-lg p-6 border border-[#2A2622]">
          {modo !== "esqueci" && (
            <div className="flex gap-1 mb-5 bg-[#12100E] rounded-lg p-1 border border-[#2A2622]">
              {[
                { key: "login", label: "Entrar" },
                { key: "cadastro", label: "Criar conta" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setModo(t.key);
                    setErro("");
                    setMensagem("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                    modo === t.key ? "bg-[#D97757] text-[#12100E]" : "text-[#8A857C]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {modo === "esqueci" ? (
            <form onSubmit={handleEsqueciSenha} className="space-y-3">
              <p className="text-sm text-[#8A857C] mb-1">
                Informe seu e-mail para receber o link de redefinição de senha.
              </p>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
              />
              {erro && <p className="text-xs text-red-400">{erro}</p>}
              {mensagem && <p className="text-xs text-green-400">{mensagem}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-md hover:bg-[#e5896d] transition disabled:opacity-60"
              >
                {carregando ? "Enviando..." : "Enviar link de recuperação"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo("login");
                  setErro("");
                  setMensagem("");
                }}
                className="w-full text-xs text-[#8A857C] py-1"
              >
                Voltar para o login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
              />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha"
                className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
              />
              {erro && <p className="text-xs text-red-400">{erro}</p>}
              {mensagem && <p className="text-xs text-green-400">{mensagem}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-md hover:bg-[#e5896d] transition disabled:opacity-60"
              >
                {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
              </button>
              {modo === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setModo("esqueci");
                    setErro("");
                    setMensagem("");
                  }}
                  className="w-full text-xs text-[#8A857C] py-1"
                >
                  Esqueci minha senha
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
