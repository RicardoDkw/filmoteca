"use client";

import { useState, useEffect } from "react";
import { Search, Star, Plus, X, Film, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AuthScreen from "@/components/AuthScreen";
import DetailsModal from "@/components/DetailsModal";

const CORES_CONFETE = ["#D97757", "#E5896D", "#F1EEE6"];

function Confete({ onFim }) {
  const [pecas] = useState(() =>
    Array.from({ length: 24 }, () => ({
      left: Math.random() * 100,
      cor: CORES_CONFETE[Math.floor(Math.random() * CORES_CONFETE.length)],
      atraso: Math.random() * 200,
      duracao: 900 + Math.random() * 500,
      tamanho: 5 + Math.random() * 4,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onFim, 1500);
    return () => clearTimeout(timer);
  }, [onFim]);

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {pecas.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.tamanho,
            height: p.tamanho,
            backgroundColor: p.cor,
            animation: `confete-cair ${p.duracao}ms ease-in ${p.atraso}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622]">
      <div className="w-full aspect-[2/3] bg-[#2A2622] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#2A2622] rounded animate-pulse w-4/5" />
        <div className="h-3 bg-[#2A2622] rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

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
  const [detalheAberto, setDetalheAberto] = useState(null);
  const [detalheVisivel, setDetalheVisivel] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [providersMap, setProvidersMap] = useState({});
  const [confeteAtivo, setConfeteAtivo] = useState(false);
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [assinaturaRecomendacoes, setAssinaturaRecomendacoes] = useState(null);
  const [salvandoRecomendacao, setSalvandoRecomendacao] = useState(null);

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

  const assistidos = filmes.filter((f) => f.status === "assistido");
  const avaliados = assistidos.filter((f) => f.rating != null);
  const notaMedia = avaliados.length
    ? (avaliados.reduce((soma, f) => soma + f.rating, 0) / avaliados.length).toFixed(1)
    : null;
  const destaque = avaliados
    .slice()
    .sort(
      (a, b) =>
        b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at)
    )[0];
  const generoContagem = Object.entries(
    assistidos
      .flatMap((f) => f.genres || [])
      .reduce((acc, g) => {
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maiorContagemGenero = generoContagem[0]?.[1] || 1;

  const candidatosRecomendacao = assistidos.filter((f) => f.rating >= 8);
  const assinaturaAtual = candidatosRecomendacao
    .map((f) => `${f.id}:${f.rating}`)
    .sort()
    .join(",");
  const recomendacoesFiltradas = recomendacoes.filter(
    (r) => !filmes.some((f) => f.id === r.id)
  );
  const carregandoRecomendacoes =
    aba === "descobrir" &&
    candidatosRecomendacao.length > 0 &&
    assinaturaAtual !== assinaturaRecomendacoes;

  // busca recomendações do TMDb com base nos filmes mais bem avaliados, com cache
  // simples: só refaz a chamada quando o conjunto de assistidos com nota >= 8 muda
  useEffect(() => {
    if (!carregandoRecomendacoes) return;
    const referencias = embaralhar(candidatosRecomendacao)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map((f) => ({ id: f.id, media_type: f.media_type }));
    let ativo = true;
    fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referencias, excluirIds: filmes.map((f) => f.id) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!ativo) return;
        setRecomendacoes(data.results || []);
        setAssinaturaRecomendacoes(assinaturaAtual);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoRecomendacoes]);

  // busca gêneros de itens antigos que ainda não têm (backfill) ao abrir Estatísticas
  useEffect(() => {
    if (aba !== "estatisticas") return;
    const semGenero = filmes.filter((f) => f.status === "assistido" && !f.genres);
    if (semGenero.length === 0) return;
    let ativo = true;
    (async () => {
      for (const f of semGenero) {
        const res = await fetch(`/api/details?id=${f.id}&type=${f.media_type}`);
        const data = await res.json();
        if (!ativo) return;
        await supabase.from("filmes").update({ genres: data.genres || [] }).eq("id", f.id);
        setFilmes((atual) =>
          atual.map((m) => (m.id === f.id ? { ...m, genres: data.genres || [] } : m))
        );
      }
    })();
    return () => {
      ativo = false;
    };
  }, [aba, filmes]);

  // busca os streamings disponíveis para os itens visíveis na grade
  useEffect(() => {
    const faltando = lista.filter((f) => !(`${f.id}-${f.media_type}` in providersMap));
    if (faltando.length === 0) return;
    let ativo = true;
    Promise.all(
      faltando.map((f) =>
        fetch(`/api/providers?id=${f.id}&type=${f.media_type}`)
          .then((res) => res.json())
          .then((data) => [`${f.id}-${f.media_type}`, data])
      )
    ).then((entradas) => {
      if (!ativo) return;
      setProvidersMap((atual) => {
        const novo = { ...atual };
        for (const [chave, data] of entradas) novo[chave] = data;
        return novo;
      });
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista]);

  function abrirParaAdicionar(filme) {
    setSelecionado(filme);
    setNota("");
  }

  function abrirModalAdicionar() {
    setModalAberto(true);
    requestAnimationFrame(() => setModalVisivel(true));
  }

  function fecharModalAdicionar() {
    setModalVisivel(false);
    setTimeout(() => {
      setModalAberto(false);
      setSelecionado(null);
      setBusca("");
      setResultados([]);
    }, 250);
  }

  function abrirDetalhe(filme) {
    setDetalheAberto(filme);
    requestAnimationFrame(() => setDetalheVisivel(true));
  }

  function fecharDetalhe() {
    setDetalheVisivel(false);
    setTimeout(() => setDetalheAberto(null), 250);
  }

  function celebrar() {
    setConfeteAtivo(true);
  }

  async function confirmarAdicao(status) {
    if (!selecionado || salvando) return;
    const jaExiste = filmes.some((f) => f.id === selecionado.id);
    if (jaExiste) {
      fecharModalAdicionar();
      return;
    }
    setSalvando(true);
    const detalhesRes = await fetch(
      `/api/details?id=${selecionado.id}&type=${selecionado.mediaType}`
    );
    const detalhes = await detalhesRes.json();
    const notaFinal = status === "assistido" && nota ? Number(nota) : null;
    const novoFilme = {
      id: selecionado.id,
      title: selecionado.title,
      year: selecionado.year,
      poster: selecionado.poster,
      media_type: selecionado.mediaType,
      overview: selecionado.overview || null,
      status,
      rating: notaFinal,
      user_id: session.user.id,
      genres: detalhes.genres || [],
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
    fecharModalAdicionar();
    if (notaFinal === 10) celebrar();
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
    if (valor === 10) celebrar();
  }

  async function adicionarRecomendacao(item) {
    if (salvandoRecomendacao || filmes.some((f) => f.id === item.id)) return;
    setSalvandoRecomendacao(item.id);
    const detalhesRes = await fetch(`/api/details?id=${item.id}&type=${item.mediaType}`);
    const detalhes = await detalhesRes.json();
    const novoFilme = {
      id: item.id,
      title: item.title,
      year: item.year,
      poster: item.poster,
      media_type: item.mediaType,
      overview: item.overview || null,
      status: "quero",
      rating: null,
      user_id: session.user.id,
      genres: detalhes.genres || [],
    };
    const { data, error } = await supabase
      .from("filmes")
      .insert(novoFilme)
      .select()
      .single();
    setSalvandoRecomendacao(null);
    if (error) {
      console.error("Erro ao adicionar recomendação:", error);
      alert("Não foi possível salvar o filme. Tente novamente.");
      return;
    }
    setFilmes((atual) => [...atual, data]);
    setRecomendacoes((atual) => atual.filter((r) => r.id !== item.id));
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
            { key: "descobrir", label: "Descobrir" },
            { key: "estatisticas", label: "Estatísticas" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition ${
                aba === t.key ? "bg-[#D97757] text-[#12100E]" : "text-[#8A857C]"
              }`}
            >
              {t.label}
              {(t.key === "assistido" || t.key === "quero") &&
                ` (${filmes.filter((f) => f.status === t.key).length})`}
            </button>
          ))}
        </div>

        <div key={aba} className="animate-[fade-slide-in_0.25s_ease-out]">
          {carregandoFilmes ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : aba === "estatisticas" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1B1815] rounded-lg border border-[#2A2622] p-4">
                  <p className="text-xs text-[#8A857C]">Total assistidos</p>
                  <p className="text-2xl font-bold mt-1">{assistidos.length}</p>
                </div>
                <div className="bg-[#1B1815] rounded-lg border border-[#2A2622] p-4">
                  <p className="text-xs text-[#8A857C]">Nota média</p>
                  <p className="text-2xl font-bold mt-1">{notaMedia ?? "—"}</p>
                </div>
              </div>

              {destaque && (
                <div>
                  <p className="text-xs text-[#8A857C] mb-2">Destaque</p>
                  <div className="flex items-center gap-3 bg-[#1B1815] rounded-lg border border-[#D97757] p-3">
                    <img
                      src={destaque.poster}
                      alt={destaque.title}
                      className="w-14 h-20 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-sm">{destaque.title}</p>
                      <p className="text-xs text-[#8A857C]">{destaque.year}</p>
                      <div className="flex items-center gap-1 mt-1 text-[#D97757] font-medium text-sm">
                        <Star className="w-3.5 h-3.5 fill-[#D97757]" />
                        {destaque.rating}/10
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-[#8A857C] mb-2">Distribuição por gênero</p>
                {generoContagem.length === 0 ? (
                  <p className="text-[#8A857C] text-center py-8 text-sm">
                    Nenhum filme assistido ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {generoContagem.map(([genero, contagem]) => (
                      <div key={genero} className="flex items-center gap-2">
                        <span className="text-xs w-24 shrink-0 truncate">{genero}</span>
                        <div className="flex-1 bg-[#1B1815] border border-[#2A2622] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#D97757] h-full rounded-full"
                            style={{ width: `${(contagem / maiorContagemGenero) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#8A857C] w-5 text-right">{contagem}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : aba === "descobrir" ? (
            candidatosRecomendacao.length === 0 ? (
              <p className="text-[#8A857C] text-center py-16 text-sm">
                Avalie alguns filmes com nota alta para receber recomendações.
              </p>
            ) : carregandoRecomendacoes ? (
              <div className="flex items-center justify-center gap-2 py-16">
                <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
                <span className="text-xs text-[#8A857C]">Buscando recomendações...</span>
              </div>
            ) : recomendacoesFiltradas.length === 0 ? (
              <p className="text-[#8A857C] text-center py-16 text-sm">
                Nenhuma recomendação encontrada por enquanto.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recomendacoesFiltradas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622] transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-black/50 hover:z-10"
                  >
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="p-3">
                      <p className="font-medium text-sm leading-tight">{item.title}</p>
                      <p className="text-xs text-[#8A857C] mt-0.5">{item.year}</p>
                      {item.overview && (
                        <p className="text-xs text-[#8A857C] mt-1.5 line-clamp-2">
                          {item.overview}
                        </p>
                      )}
                      <button
                        onClick={() => adicionarRecomendacao(item)}
                        disabled={salvandoRecomendacao === item.id}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md bg-[#2A2622] hover:bg-[#D97757] hover:text-[#12100E] transition disabled:opacity-60"
                      >
                        <Plus className="w-3 h-3" />
                        {salvandoRecomendacao === item.id ? "Adicionando..." : "Quero ver"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : lista.length === 0 ? (
            <p className="text-[#8A857C] text-center py-16 text-sm">
              Nada por aqui ainda. Toque no + para adicionar.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {lista.map((f) => {
                const providers = providersMap[`${f.id}-${f.media_type}`];
                const destaqueProvider =
                  providers?.flatrate?.[0] || providers?.rent?.[0] || providers?.buy?.[0];
                return (
                  <div
                    key={f.id}
                    onClick={() => abrirDetalhe(f)}
                    className="group relative bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-black/50 hover:z-10 active:scale-95"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remover(f.id);
                      }}
                      className="absolute top-2 right-2 z-10 bg-black/60 rounded-full p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative">
                      <img
                        src={f.poster}
                        alt={f.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      {destaqueProvider && (
                        <img
                          src={destaqueProvider.logo}
                          alt={destaqueProvider.name}
                          title={destaqueProvider.name}
                          className="absolute bottom-2 left-2 w-6 h-6 rounded shadow-md"
                        />
                      )}
                    </div>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                avaliar(f.id, n);
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2622] hover:bg-[#D97757] hover:text-[#12100E] transition"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={abrirModalAdicionar}
          className="fixed bottom-6 right-6 bg-[#D97757] text-[#12100E] rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:scale-95 transition"
          aria-label="Adicionar filme"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {modalAberto && (
        <div
          className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
            modalVisivel ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-[#1B1815] rounded-t-2xl sm:rounded-lg p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
              modalVisivel
                ? "translate-y-0 sm:scale-100 opacity-100"
                : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selecionado ? "Adicionar" : "Buscar filme ou série"}
              </h2>
              <button onClick={fecharModalAdicionar}>
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
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
                    <span className="text-xs text-[#8A857C]">Buscando...</span>
                  </div>
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

      {detalheAberto && (
        <DetailsModal filme={detalheAberto} visivel={detalheVisivel} onClose={fecharDetalhe} />
      )}

      {confeteAtivo && <Confete onFim={() => setConfeteAtivo(false)} />}
    </div>
  );
}