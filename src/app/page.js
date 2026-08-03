"use client";

import { useState, useEffect } from "react";
import { Search, Star, Plus, X, Film, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AuthScreen from "@/components/AuthScreen";

export default function Filmoteca() {
  const [session, setSession] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [filmes, setFilmes] = useState([]);
  const [carregandoFilmes, setCarregandoFilmes] = useState(true);
  const [aba, setAba] = useState("assistido");
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [nota, setNota] = useState("");
  const [salvando, setSalvando] = useState(false);

  // observa a sessão de autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregandoSessao(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // carrega a lista do Supabase quando há um usuário logado
  useEffect(() => {
    async function carregar() {
      if (!session) {
        setFilmes([]);
        setCarregandoFilmes(false);
        return;
      }
      setCarregandoFilmes(true);
      const { data, error } = await supabase
        .from("filmes")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Erro ao carregar filmes:", error);
      } else {
        setFilmes(data || []);
      }
      setCarregandoFilmes(false);
    }
    carregar();
  }, [session]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // busca na API do TMDb enquanto o usuário digita
  useEffect(() => {
    const termo = busca.trim();
    const timer = setTimeout(async () => {
      if (termo.length < 2) {
        setResultados([]);
        return;
      }
      setCarregando(true);
      const res = await fetch(`/api/search?query=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setResultados(data.results || []);
      setCarregando(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const lista = filmes
    .filter((f) => f.status === aba)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  function abrirParaAdicionar(filme) {
    setSelecionado(filme);
    setNota("");
  }

  async function confirmarAdicao(status) {
    if (!selecionado || salvando) return;
    const jaExiste = filmes.some((f) => f.id === selecionado.id);
    if (jaExiste) {
      setModalAberto(false);
      setSelecionado(null);
      setBusca("");
      return;
    }
    setSalvando(true);
    const novoFilme = {
      id: selecionado.id,
      title: selecionado.title,
      year: selecionado.year,
      poster: selecionado.poster,
      media_type: selecionado.mediaType,
      overview: selecionado.overview || null,
      status,
      rating: status === "assistido" && nota ? Number(nota) : null,
      user_id: session.user.id,
    };
    const { data, error } = await supabase
      .from("filmes")
      .insert(novoFilme)
      .select()
      .single();
    setSalvando(false);
    if (error) {
      console.error("Erro ao adicionar filme:", error);
      alert("Não foi possível salvar o filme. Tente novamente.");
      return;
    }
    setFilmes([...filmes, data]);
    setModalAberto(false);
    setSelecionado(null);
    setBusca("");
    setResultados([]);
  }

  async function remover(id) {
    const { error } = await supabase.from("filmes").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover filme:", error);
      alert("Não foi possível remover o filme. Tente novamente.");
      return;
    }
    setFilmes(filmes.filter((f) => f.id !== id));
  }

  async function avaliar(id, valor) {
    const { error } = await supabase
      .from("filmes")
      .update({ rating: valor, status: "assistido" })
      .eq("id", id);
    if (error) {
      console.error("Erro ao avaliar filme:", error);
      alert("Não foi possível salvar a nota. Tente novamente.");
      return;
    }
    setFilmes(
      filmes.map((f) => (f.id === id ? { ...f, rating: valor, status: "assistido" } : f))
    );
  }

  if (carregandoSessao) {
    return (
      <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] flex items-center justify-center">
        <p className="text-[#8A857C] text-sm">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] p-6">
      <div className="max-w-md mx-auto pb-20">
        <header className="flex items-center justify-between gap-2 mb-5 pt-1">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[#D97757]" />
            <h1 className="text-2xl font-bold tracking-wide">MINHA FILMOTECA</h1>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sair"
            className="text-[#8A857C] hover:text-[#F1EEE6] transition p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <div className="flex gap-1 mb-5 bg-[#1B1815] rounded-lg p-1 border border-[#2A2622]">
          {[
            { key: "assistido", label: "Assistidos" },
            { key: "quero", label: "Quero ver" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                aba === t.key ? "bg-[#D97757] text-[#12100E]" : "text-[#8A857C]"
              }`}
            >
              {t.label} ({filmes.filter((f) => f.status === t.key).length})
            </button>
          ))}
        </div>

        {carregandoFilmes ? (
          <p className="text-[#8A857C] text-center py-16 text-sm">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-[#8A857C] text-center py-16 text-sm">
            Nada por aqui ainda. Toque no + para adicionar.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {lista.map((f) => (
              <div
                key={f.id}
                className="group relative bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622]"
              >
                <button
                  onClick={() => remover(f.id)}
                  className="absolute top-2 right-2 z-10 bg-black/60 rounded-full p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <img src={f.poster} alt={f.title} className="w-full aspect-[2/3] object-cover" />
                <div className="p-3">
                  <p className="font-medium text-sm leading-tight">{f.title}</p>
                  <p className="text-xs text-[#8A857C] mt-0.5">{f.year}</p>
                  {f.overview && (
                    <p className="text-xs text-[#8A857C] mt-1.5 line-clamp-2">{f.overview}</p>
                  )}

                  {f.status === "assistido" ? (
                    <div className="flex items-center gap-1 mt-2 text-[#D97757] font-medium text-sm">
                      <Star className="w-3.5 h-3.5 fill-[#D97757]" />
                      {f.rating ?? "—"}/10
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() => avaliar(f.id, n)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2622] hover:bg-[#D97757] hover:text-[#12100E] transition"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setModalAberto(true)}
          className="fixed bottom-6 right-6 bg-[#D97757] text-[#12100E] rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:scale-95 transition"
          aria-label="Adicionar filme"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
          <div className="bg-[#1B1815] rounded-t-2xl sm:rounded-lg p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selecionado ? "Adicionar" : "Buscar filme ou série"}
              </h2>
              <button
                onClick={() => {
                  setModalAberto(false);
                  setSelecionado(null);
                  setBusca("");
                  setResultados([]);
                }}
              >
                <X className="w-4 h-4 text-[#8A857C]" />
              </button>
            </div>

            {!selecionado ? (
              <>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A857C]" />
                  <input
                    autoFocus
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite o nome do filme ou série"
                    className="w-full bg-[#12100E] border border-[#2A2622] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
                  />
                </div>

                {carregando && (
                  <p className="text-xs text-[#8A857C] text-center py-4">Buscando...</p>
                )}

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {resultados.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => abrirParaAdicionar(r)}
                      className="w-full flex items-center gap-3 bg-[#12100E] border border-[#2A2622] rounded-md p-2 hover:border-[#D97757] transition text-left"
                    >
                      <img src={r.poster} alt={r.title} className="w-10 h-14 object-cover rounded" />
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-[#8A857C]">
                          {r.year} · {r.mediaType === "tv" ? "Série" : "Filme"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={selecionado.poster}
                    alt={selecionado.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{selecionado.title}</p>
                    <p className="text-xs text-[#8A857C]">{selecionado.year}</p>
                    {selecionado.overview && (
                      <p className="text-xs text-[#8A857C] mt-1 line-clamp-3">
                        {selecionado.overview}
                      </p>
                    )}
                  </div>
                </div>

                <label className="text-xs text-[#8A857C]">
                  Já assistiu? Dê uma nota (opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Nota de 1 a 10"
                  className="w-full bg-[#12100E] border border-[#2A2622] rounded-md px-3 py-2 mt-1 mb-4 text-sm focus:outline-none focus:border-[#D97757]"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => confirmarAdicao("quero")}
                    disabled={salvando}
                    className="flex-1 border border-[#2A2622] text-[#F1EEE6] font-medium py-2 rounded-md hover:border-[#D97757] transition disabled:opacity-60"
                  >
                    Quero assistir
                  </button>
                  <button
                    onClick={() => confirmarAdicao("assistido")}
                    disabled={salvando}
                    className="flex-1 bg-[#D97757] text-[#12100E] font-medium py-2 rounded-md hover:bg-[#e5896d] transition disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Já assisti"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}