"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function traduzirErro(mensagem) {
  if (!mensagem) return "Não foi possível concluir. Tente novamente.";
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Este e-mail já está cadastrado.";
  if (m.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Não foi possível conectar. Tente novamente.";
  return "Não foi possível concluir. Tente novamente.";
}

export default function AuthScreen() {
  const [modo, setModo] = useState("login"); // "login" | "cadastro" | "esqueci"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const senhaCurta = modo === "cadastro" && senha.length > 0 && senha.length < 6;

  function trocarModo(novoModo) {
    setModo(novoModo);
    setErro("");
    setMensagem("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    if (modo === "cadastro" && senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) setErro(traduzirErro(error.message));
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) {
          setErro(traduzirErro(error.message));
        } else if (!data.session) {
          setMensagem("Cadastro criado! Verifique seu e-mail para confirmar a conta.");
        }
      }
    } catch (e2) {
      setErro(traduzirErro(e2.message));
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
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setErro(traduzirErro(error.message));
      else setMensagem("Enviamos um e-mail com o link para redefinir sua senha.");
    } catch (e2) {
      setErro(traduzirErro(e2.message));
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] p-6 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1B1815] border border-[#2A2622] flex items-center justify-center">
            <Film className="w-7 h-7 text-[#D97757]" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">Filmoteca</h1>
        </div>

        <div className="bg-[#1B1815] rounded-lg p-6 border border-[#2A2622]">
          <div key={modo} className="animate-[fade-slide-in_0.25s_ease-out]">
            {modo !== "esqueci" && (
              <div className="flex gap-1 mb-5 bg-[#12100E] rounded-lg p-1 border border-[#2A2622]">
                {[
                  { key: "login", label: "Entrar" },
                  { key: "cadastro", label: "Criar conta" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => trocarModo(t.key)}
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
                  className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
                />
                {erro && <p className="text-xs text-red-400">{erro}</p>}
                {mensagem && <p className="text-xs text-green-400">{mensagem}</p>}
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
                >
                  {carregando ? "Enviando..." : "Enviar link de recuperação"}
                </button>
                <button
                  type="button"
                  onClick={() => trocarModo("login")}
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
                  className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
                />
                <div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Senha"
                    className={`w-full bg-[#12100E] border rounded-lg px-3 py-2 text-sm focus:outline-none transition ${
                      senhaCurta
                        ? "border-red-400/60 focus:border-red-400"
                        : "border-[#2A2622] focus:border-[#D97757]"
                    }`}
                  />
                  {senhaCurta && (
                    <p className="text-xs text-red-400 mt-1">
                      A senha precisa ter pelo menos 6 caracteres.
                    </p>
                  )}
                </div>
                {erro && <p className="text-xs text-red-400">{erro}</p>}
                {mensagem && <p className="text-xs text-green-400">{mensagem}</p>}
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
                >
                  {carregando
                    ? modo === "login"
                      ? "Entrando..."
                      : "Criando conta..."
                    : modo === "login"
                    ? "Entrar"
                    : "Criar conta"}
                </button>
                {modo === "login" && (
                  <button
                    type="button"
                    onClick={() => trocarModo("esqueci")}
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
    </div>
  );
}
