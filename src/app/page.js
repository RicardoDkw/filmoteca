"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Plus,
  X,
  Film,
  LogOut,
  Lock,
  Users,
  ArrowLeft,
  User,
  Check,
  Bookmark,
  Compass,
  BarChart,
  Globe,
  Bell,
  Camera,
  Trash2,
  Heart,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AuthScreen from "@/components/AuthScreen";
import DetailsModal from "@/components/DetailsModal";
import RatingInput, { notaEhValida } from "@/components/RatingInput";
import ComentariosFilmeModal from "@/components/ComentariosFilmeModal";
import NotificacoesModal from "@/components/NotificacoesModal";
import AvaliarModal from "@/components/AvaliarModal";
import PostarModal from "@/components/PostarModal";
import IdentificarModal from "@/components/IdentificarModal";
import Onboarding from "@/components/Onboarding";
import Roleta from "@/components/Roleta";
import ToastConquistas from "@/components/ToastConquistas";
import EscolherNick from "@/components/EscolherNick";
import PerfilModal from "@/components/PerfilModal";
import { GENEROS_TMDB } from "@/lib/genres";
import { BADGES, calcularDesbloqueadas } from "@/lib/badges";
import { formatarTempoRelativo } from "@/lib/tempo";

const CORES_CONFETE = ["#D97757", "#E5896D", "#F1EEE6"];

const ABAS = [
  { key: "assistido", label: "Assistidos", Icon: Check },
  { key: "quero", label: "Quero ver", Icon: Bookmark },
  { key: "descobrir", label: "Descobrir", Icon: Compass },
  { key: "feed", label: "Feed", Icon: Camera },
  { key: "estatisticas", label: "Estatísticas", Icon: BarChart },
  { key: "amigos", label: "Amigos", Icon: Users },
];

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
    <div className="bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622] shadow-lg shadow-black/30">
      <div className="w-full aspect-[2/3] bg-[#2A2622] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#2A2622] rounded-md animate-pulse w-4/5" />
        <div className="h-3 bg-[#2A2622] rounded-md animate-pulse w-1/3" />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4 pl-3 border-l-4 border-[#D97757]">
      {Icon && <Icon className="w-5 h-5 text-[#D97757] shrink-0" />}
      <h2 className="text-lg font-bold tracking-wide">{children}</h2>
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
  const [onboardingFechado, setOnboardingFechado] = useState(false);
  const [toastConquistas, setToastConquistas] = useState(null);
  const [sincronizandoConquistas, setSincronizandoConquistas] = useState(false);
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [assinaturaRecomendacoes, setAssinaturaRecomendacoes] = useState(null);
  const [salvandoRecomendacao, setSalvandoRecomendacao] = useState(null);
  const [roletaAberta, setRoletaAberta] = useState(false);
  const [roletaVisivel, setRoletaVisivel] = useState(false);
  const [generoSelecionado, setGeneroSelecionado] = useState(null);
  const [sugestoesGenero, setSugestoesGenero] = useState([]);
  const [generoCarregado, setGeneroCarregado] = useState(null);
  const [paginaGenero, setPaginaGenero] = useState(1);
  const [carregandoMaisGenero, setCarregandoMaisGenero] = useState(false);
  const [semMaisGenero, setSemMaisGenero] = useState(false);
  const [identificarModalAberto, setIdentificarModalAberto] = useState(false);
  const [identificarModalVisivel, setIdentificarModalVisivel] = useState(false);
  const [buscaNickAmigo, setBuscaNickAmigo] = useState("");
  const [buscandoAmigo, setBuscandoAmigo] = useState(false);
  const [erroBuscaAmigo, setErroBuscaAmigo] = useState("");
  const [seguindo, setSeguindo] = useState([]);
  const [subAbaAmigos, setSubAbaAmigos] = useState("seguindo");
  const [seguidores, setSeguidores] = useState([]);
  const [carregandoSeguidores, setCarregandoSeguidores] = useState(false);
  const [seguindoDeVolta, setSeguindoDeVolta] = useState(null);
  const [amigoSelecionado, setAmigoSelecionado] = useState(null);
  const [assistidosDoAmigo, setAssistidosDoAmigo] = useState({});
  const [carregandoAssistidosAmigo, setCarregandoAssistidosAmigo] = useState(false);
  const [deixandoDeSeguir, setDeixandoDeSeguir] = useState(null);
  const [perfilProprio, setPerfilProprio] = useState(null);
  const [perfilCarregadoPara, setPerfilCarregadoPara] = useState(null);
  const [perfisPorId, setPerfisPorId] = useState({});
  const [perfilModalAberto, setPerfilModalAberto] = useState(false);
  const [perfilModalVisivel, setPerfilModalVisivel] = useState(false);
  const [comentarioFilmeAberto, setComentarioFilmeAberto] = useState(null);
  const [comentarioFilmeVisivel, setComentarioFilmeVisivel] = useState(false);
  const [avaliarModalAberto, setAvaliarModalAberto] = useState(null);
  const [avaliarModalVisivel, setAvaliarModalVisivel] = useState(false);
  const [posts, setPosts] = useState([]);
  const [carregandoPosts, setCarregandoPosts] = useState(false);
  const [postarModalAberto, setPostarModalAberto] = useState(false);
  const [postarModalVisivel, setPostarModalVisivel] = useState(false);
  const [apagandoPost, setApagandoPost] = useState(null);
  const [curtidasPorPost, setCurtidasPorPost] = useState({});
  const [curtidoPorMim, setCurtidoPorMim] = useState({});
  const [curtindoPost, setCurtindoPost] = useState(null);
  const [comentariosContagemPorPost, setComentariosContagemPorPost] = useState({});
  const [marcacoesPorPost, setMarcacoesPorPost] = useState({});
  const [perfisMarcados, setPerfisMarcados] = useState({});
  const [postComentariosAberto, setPostComentariosAberto] = useState(null);
  const [comentariosPorPost, setComentariosPorPost] = useState({});
  const [carregandoComentariosPost, setCarregandoComentariosPost] = useState(null);
  const [perfisAutoresComentariosPost, setPerfisAutoresComentariosPost] = useState({});
  const [novoComentarioPost, setNovoComentarioPost] = useState("");
  const [enviandoComentarioPost, setEnviandoComentarioPost] = useState(false);
  const [apagandoComentarioPost, setApagandoComentarioPost] = useState(null);
  const [notificacaoModalAberto, setNotificacaoModalAberto] = useState(false);
  const [notificacaoModalVisivel, setNotificacaoModalVisivel] = useState(false);
  const [contagemNaoLidas, setContagemNaoLidas] = useState(0);

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
        .eq("user_id", session.user.id)
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

  // carrega o perfil do próprio usuário (nick obrigatório antes de usar o app)
  useEffect(() => {
    if (session) return;
    const limpar = setTimeout(() => {
      setPerfilProprio(null);
      setPerfilCarregadoPara(null);
    }, 0);
    return () => clearTimeout(limpar);
  }, [session]);

  const carregandoPerfil = !!session && perfilCarregadoPara !== session.user.id;

  useEffect(() => {
    if (!carregandoPerfil) return;
    let ativo = true;
    supabase
      .from("perfis")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error("Erro ao carregar perfil:", error);
        setPerfilProprio(data || null);
        setPerfilCarregadoPara(session.user.id);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoPerfil]);

  function abrirPerfilModal() {
    setPerfilModalAberto(true);
    requestAnimationFrame(() => setPerfilModalVisivel(true));
  }

  function fecharPerfilModal() {
    setPerfilModalVisivel(false);
    setTimeout(() => setPerfilModalAberto(false), 250);
  }

  async function carregarContagemNaoLidas() {
    const { count, error } = await supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("destinatario_id", session.user.id)
      .eq("lida", false);
    if (error) {
      console.error("Erro ao carregar contagem de notificações:", error);
      return;
    }
    setContagemNaoLidas(count || 0);
  }

  function abrirNotificacoes() {
    setNotificacaoModalAberto(true);
    requestAnimationFrame(() => setNotificacaoModalVisivel(true));
  }

  function fecharNotificacoes() {
    setNotificacaoModalVisivel(false);
    setTimeout(() => setNotificacaoModalAberto(false), 250);
    carregarContagemNaoLidas();
  }

  function abrirComentariosPorId(filmeId, ownerId) {
    const filme = filmes.find((f) => f.id === filmeId && f.user_id === ownerId);
    if (!filme) return;
    abrirComentariosFilme(filme);
  }

  // carrega e atualiza periodicamente a contagem de notificações não lidas
  useEffect(() => {
    if (!session) return;
    let ativo = true;
    function buscar() {
      supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("destinatario_id", session.user.id)
        .eq("lida", false)
        .then(({ count, error }) => {
          if (!ativo) return;
          if (error) {
            console.error("Erro ao carregar contagem de notificações:", error);
            return;
          }
          setContagemNaoLidas(count || 0);
        });
    }
    buscar();
    const intervalo = setInterval(buscar, 60000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [session]);

  // carrega quem o usuário segue e resolve nick/nome/avatar pra exibição
  useEffect(() => {
    if (!session) {
      const limpar = setTimeout(() => {
        setSeguindo([]);
        setPerfisPorId({});
      }, 0);
      return () => clearTimeout(limpar);
    }
    let ativo = true;
    (async () => {
      const { data, error } = await supabase
        .from("seguidores")
        .select("*")
        .eq("seguidor_id", session.user.id);
      if (error) {
        console.error("Erro ao carregar seguidores:", error);
        return;
      }
      if (!ativo) return;
      setSeguindo(data || []);
      const ids = (data || []).map((s) => s.seguido_id);
      if (ids.length === 0) return;
      const { data: perfisData, error: erroPerfis } = await supabase
        .from("perfis")
        .select("user_id, nick, nome, avatar_url")
        .in("user_id", ids);
      if (erroPerfis) {
        console.error("Erro ao carregar perfis de seguidos:", erroPerfis);
        return;
      }
      if (!ativo) return;
      const mapa = {};
      for (const p of perfisData || []) mapa[p.user_id] = p;
      setPerfisPorId(mapa);
    })();
    return () => {
      ativo = false;
    };
  }, [session]);

  // carrega quem segue o usuário (lado oposto de "seguindo") e resolve os perfis em lote
  useEffect(() => {
    if (!session) {
      const limpar = setTimeout(() => setSeguidores([]), 0);
      return () => clearTimeout(limpar);
    }
    let ativo = true;
    (async () => {
      setCarregandoSeguidores(true);
      const { data, error } = await supabase
        .from("seguidores")
        .select("*")
        .eq("seguido_id", session.user.id);
      if (!ativo) return;
      setCarregandoSeguidores(false);
      if (error) {
        console.error("Erro ao carregar seguidores:", error);
        return;
      }
      setSeguidores(data || []);
      const ids = (data || []).map((s) => s.seguidor_id).filter((id) => !perfisPorId[id]);
      if (ids.length === 0) return;
      const { data: perfisData, error: erroPerfis } = await supabase
        .from("perfis")
        .select("user_id, nick, nome, avatar_url")
        .in("user_id", ids);
      if (!ativo) return;
      if (erroPerfis) {
        console.error("Erro ao carregar perfis dos seguidores:", erroPerfis);
        return;
      }
      setPerfisPorId((atual) => {
        const novo = { ...atual };
        for (const p of perfisData || []) novo[p.user_id] = p;
        return novo;
      });
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // carrega o feed (próprios posts + de quem segue) ao abrir a aba, junto com
  // curtidas e contagem de comentários de todos os posts visíveis em lote (não por post)
  useEffect(() => {
    async function carregarPosts() {
      if (aba !== "feed" || !session) return;
      setCarregandoPosts(true);
      const ids = [session.user.id, ...seguindo.map((s) => s.seguido_id)];
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("autor_id", ids)
        .order("created_at", { ascending: false });
      if (error) {
        setCarregandoPosts(false);
        console.error("Erro ao carregar posts:", error);
        return;
      }
      const lista = data || [];
      setPosts(lista);
      const postIds = lista.map((p) => p.id);
      if (postIds.length === 0) {
        setCarregandoPosts(false);
        setCurtidasPorPost({});
        setCurtidoPorMim({});
        setComentariosContagemPorPost({});
        setMarcacoesPorPost({});
        return;
      }
      const [curtidasRes, comentariosRes, marcacoesRes] = await Promise.all([
        supabase.from("curtidas_post").select("post_id, usuario_id").in("post_id", postIds),
        supabase.from("comentarios_post").select("post_id").in("post_id", postIds),
        supabase.from("marcacoes_post").select("post_id, usuario_id").in("post_id", postIds),
      ]);
      setCarregandoPosts(false);
      if (curtidasRes.error) {
        console.error("Erro ao carregar curtidas:", curtidasRes.error);
      } else {
        const contagem = {};
        const minhas = {};
        for (const r of curtidasRes.data || []) {
          contagem[r.post_id] = (contagem[r.post_id] || 0) + 1;
          if (r.usuario_id === session.user.id) minhas[r.post_id] = true;
        }
        setCurtidasPorPost(contagem);
        setCurtidoPorMim(minhas);
      }
      if (comentariosRes.error) {
        console.error("Erro ao carregar contagem de comentários dos posts:", comentariosRes.error);
      } else {
        const contagem = {};
        for (const r of comentariosRes.data || []) {
          contagem[r.post_id] = (contagem[r.post_id] || 0) + 1;
        }
        setComentariosContagemPorPost(contagem);
      }
      if (marcacoesRes.error) {
        console.error("Erro ao carregar marcações dos posts:", marcacoesRes.error);
      } else {
        const porPost = {};
        for (const r of marcacoesRes.data || []) {
          if (!porPost[r.post_id]) porPost[r.post_id] = [];
          porPost[r.post_id].push(r.usuario_id);
        }
        setMarcacoesPorPost(porPost);
        const idsFaltando = [
          ...new Set(
            (marcacoesRes.data || [])
              .map((r) => r.usuario_id)
              .filter((id) => id !== session.user.id && !perfisPorId[id])
          ),
        ];
        if (idsFaltando.length > 0) {
          const { data: perfisData, error: erroPerfis } = await supabase
            .from("perfis")
            .select("user_id, nick, nome, avatar_url")
            .in("user_id", idsFaltando);
          if (erroPerfis) {
            console.error("Erro ao carregar perfis das pessoas marcadas:", erroPerfis);
          } else {
            setPerfisMarcados((atual) => {
              const novo = { ...atual };
              for (const p of perfisData || []) novo[p.user_id] = p;
              return novo;
            });
          }
        }
      }
    }
    carregarPosts();
  }, [aba, seguindo, session]);

  async function seguirUsuario() {
    if (buscandoAmigo) return;
    const nick = buscaNickAmigo.trim();
    if (!nick) {
      setErroBuscaAmigo("Informe um nick.");
      return;
    }
    setErroBuscaAmigo("");
    setBuscandoAmigo(true);
    const res = await fetch("/api/buscar-por-nick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ nick }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBuscandoAmigo(false);
      if (res.status === 404) {
        setErroBuscaAmigo("Usuário não encontrado.");
      } else if (res.status === 401) {
        setErroBuscaAmigo("Sua sessão expirou. Atualize a página e faça login novamente.");
      } else {
        console.error("Erro ao buscar por nick:", res.status, data);
        setErroBuscaAmigo("Não foi possível buscar o usuário. Tente novamente.");
      }
      return;
    }
    const perfilEncontrado = data.perfil;
    if (perfilEncontrado.user_id === session.user.id) {
      setBuscandoAmigo(false);
      setErroBuscaAmigo("Você não pode seguir a si mesmo.");
      return;
    }
    const { data: novo, error } = await supabase
      .from("seguidores")
      .insert({ seguidor_id: session.user.id, seguido_id: perfilEncontrado.user_id })
      .select()
      .single();
    setBuscandoAmigo(false);
    if (error) {
      if (error.code === "23505") {
        setErroBuscaAmigo("Você já segue esse usuário.");
      } else {
        console.error("Erro ao seguir usuário:", error);
        setErroBuscaAmigo("Não foi possível seguir esse usuário. Tente novamente.");
      }
      return;
    }
    setSeguindo((atual) => [...atual, novo]);
    setPerfisPorId((atual) => ({ ...atual, [perfilEncontrado.user_id]: perfilEncontrado }));
    setBuscaNickAmigo("");
  }

  async function deixarDeSeguir(id) {
    if (deixandoDeSeguir) return;
    setDeixandoDeSeguir(id);
    const { error } = await supabase
      .from("seguidores")
      .delete()
      .eq("seguidor_id", session.user.id)
      .eq("seguido_id", id);
    setDeixandoDeSeguir(null);
    if (error) {
      console.error("Erro ao deixar de seguir:", error);
      alert("Não foi possível deixar de seguir. Tente novamente.");
      return;
    }
    setSeguindo((atual) => atual.filter((s) => s.seguido_id !== id));
    if (amigoSelecionado === id) setAmigoSelecionado(null);
  }

  async function seguirDeVolta(id) {
    if (seguindoDeVolta) return;
    setSeguindoDeVolta(id);
    const { data, error } = await supabase
      .from("seguidores")
      .insert({ seguidor_id: session.user.id, seguido_id: id })
      .select()
      .single();
    setSeguindoDeVolta(null);
    if (error) {
      if (error.code !== "23505") {
        console.error("Erro ao seguir de volta:", error);
        alert("Não foi possível seguir essa pessoa. Tente novamente.");
        return;
      }
    } else {
      setSeguindo((atual) => [...atual, data]);
    }
  }

  function abrirAmigo(id) {
    setAmigoSelecionado(id);
    if (assistidosDoAmigo[id]) return;
    setCarregandoAssistidosAmigo(true);
    supabase
      .from("filmes")
      .select("*")
      .eq("user_id", id)
      .eq("status", "assistido")
      .then(({ data, error }) => {
        setCarregandoAssistidosAmigo(false);
        if (error) {
          console.error("Erro ao carregar assistidos do amigo:", error);
          return;
        }
        setAssistidosDoAmigo((atual) => ({ ...atual, [id]: data || [] }));
      });
  }

  // primeiro acesso: sem filmes salvos e onboarding nunca visto
  const mostrarOnboarding =
    !!session &&
    !carregandoFilmes &&
    !onboardingFechado &&
    filmes.length === 0 &&
    !session.user.user_metadata?.onboarding_visto;

  async function finalizarOnboarding() {
    setOnboardingFechado(true);
    const { error } = await supabase.auth.updateUser({ data: { onboarding_visto: true } });
    if (error) console.error("Erro ao salvar onboarding:", error);
  }

  const badgesDesbloqueadasAgora = calcularDesbloqueadas(filmes);
  // mapa { id: dataISO } persistido permanentemente — uma vez conquistada, nunca sai daqui
  const badgesConquistadas = session?.user?.user_metadata?.badges_conquistadas || {};
  const novasConquistas = badgesDesbloqueadasAgora.filter((id) => !(id in badgesConquistadas));
  // o que aparece na tela é a união: permanentes + as que o critério atual ainda cumpre
  const badgesParaExibir = Array.from(
    new Set([...Object.keys(badgesConquistadas), ...badgesDesbloqueadasAgora])
  );

  // ao detectar conquistas novas, mostra o toast uma vez e adiciona permanentemente ao
  // mapa salvo em user_metadata (nunca remove uma badge já conquistada anteriormente)
  useEffect(() => {
    if (
      novasConquistas.length === 0 ||
      sincronizandoConquistas ||
      carregandoFilmes ||
      !session
    ) {
      return;
    }
    const timer = setTimeout(async () => {
      setSincronizandoConquistas(true);
      setToastConquistas(BADGES.filter((b) => novasConquistas.includes(b.id)));
      const agora = new Date().toISOString();
      const atualizadas = { ...badgesConquistadas };
      for (const id of novasConquistas) atualizadas[id] = agora;
      const { error } = await supabase.auth.updateUser({
        data: { badges_conquistadas: atualizadas },
      });
      if (error) console.error("Erro ao salvar conquistas:", error);
      setSincronizandoConquistas(false);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novasConquistas.join(","), carregandoFilmes, session]);

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
  const topAvaliados = avaliados
    .slice()
    .sort(
      (a, b) =>
        b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at)
    )
    .slice(0, 8);
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
    generoSelecionado === null &&
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

  const sugestoesGeneroFiltradas = sugestoesGenero.filter(
    (r) => !filmes.some((f) => f.id === r.id)
  );
  const carregandoGenero = generoSelecionado !== null && generoSelecionado !== generoCarregado;

  // escolhe /api/discover-anime (chip especial) ou /api/discover-genre (demais categorias)
  function buscarSugestoesPorCategoria(pagina) {
    const excluirIds = filmes.map((f) => f.id);
    const url = generoSelecionado === "anime" ? "/api/discover-anime" : "/api/discover-genre";
    const body =
      generoSelecionado === "anime"
        ? { excluirIds, page: pagina }
        : { genreId: generoSelecionado, excluirIds, page: pagina };
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => res.json());
  }

  // busca sugestões da categoria escolhida manualmente; refaz quando a categoria muda
  useEffect(() => {
    if (!carregandoGenero) return;
    let ativo = true;
    buscarSugestoesPorCategoria(1).then((data) => {
      if (!ativo) return;
      setSugestoesGenero(data.results || []);
      setGeneroCarregado(generoSelecionado);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoGenero]);

  function selecionarGenero(id) {
    setGeneroSelecionado(generoSelecionado === id ? null : id);
    setPaginaGenero(1);
    setSemMaisGenero(false);
  }

  function limparFiltroGenero() {
    setGeneroSelecionado(null);
    setPaginaGenero(1);
    setSemMaisGenero(false);
  }

  async function carregarMaisGenero() {
    if (carregandoMaisGenero) return;
    setCarregandoMaisGenero(true);
    const proximaPagina = paginaGenero + 1;
    const data = await buscarSugestoesPorCategoria(proximaPagina);
    const novos = (data.results || []).filter(
      (r) => !sugestoesGenero.some((s) => s.id === r.id)
    );
    setCarregandoMaisGenero(false);
    if (novos.length === 0) {
      setSemMaisGenero(true);
      return;
    }
    setSugestoesGenero((atual) => [...atual, ...novos]);
    setPaginaGenero(proximaPagina);
  }

  const carregandoDescobrir = generoSelecionado !== null ? carregandoGenero : carregandoRecomendacoes;
  const itensDescobrir = generoSelecionado !== null ? sugestoesGeneroFiltradas : recomendacoesFiltradas;

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

  // busca a nota da comunidade (TMDb) para itens visíveis que ainda não têm
  useEffect(() => {
    const faltando = lista.filter((f) => f.vote_average == null);
    if (faltando.length === 0) return;
    let ativo = true;
    (async () => {
      for (const f of faltando) {
        const res = await fetch(`/api/details?id=${f.id}&type=${f.media_type}`);
        const data = await res.json();
        if (!ativo) return;
        if (typeof data.voteAverage !== "number") continue;
        await supabase.from("filmes").update({ vote_average: data.voteAverage }).eq("id", f.id);
        setFilmes((atual) =>
          atual.map((m) => (m.id === f.id ? { ...m, vote_average: data.voteAverage } : m))
        );
      }
    })();
    return () => {
      ativo = false;
    };
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

  function abrirIdentificarModal() {
    setIdentificarModalAberto(true);
    requestAnimationFrame(() => setIdentificarModalVisivel(true));
  }

  function fecharIdentificarModal() {
    setIdentificarModalVisivel(false);
    setTimeout(() => setIdentificarModalAberto(false), 250);
  }

  function handleTituloIdentificado(titulo) {
    setBusca(titulo);
    abrirModalAdicionar();
  }

  function abrirDetalhe(filme) {
    setDetalheAberto(filme);
    requestAnimationFrame(() => setDetalheVisivel(true));
  }

  function fecharDetalhe() {
    setDetalheVisivel(false);
    setTimeout(() => setDetalheAberto(null), 250);
  }

  function abrirComentariosFilme(filme) {
    setComentarioFilmeAberto(filme);
    requestAnimationFrame(() => setComentarioFilmeVisivel(true));
  }

  function fecharComentariosFilme() {
    setComentarioFilmeVisivel(false);
    setTimeout(() => setComentarioFilmeAberto(null), 250);
  }

  function abrirAvaliarModal(filme) {
    setAvaliarModalAberto(filme);
    requestAnimationFrame(() => setAvaliarModalVisivel(true));
  }

  function fecharAvaliarModal() {
    setAvaliarModalVisivel(false);
    setTimeout(() => setAvaliarModalAberto(null), 250);
  }

  function abrirPostarModal() {
    setPostarModalAberto(true);
    requestAnimationFrame(() => setPostarModalVisivel(true));
  }

  function fecharPostarModal() {
    setPostarModalVisivel(false);
    setTimeout(() => setPostarModalAberto(false), 250);
  }

  function handlePostado(novoPost, marcados) {
    setPosts((atual) => [novoPost, ...atual]);
    if (marcados && marcados.length > 0) {
      setMarcacoesPorPost((atual) => ({
        ...atual,
        [novoPost.id]: marcados.map((m) => m.user_id),
      }));
      setPerfisMarcados((atual) => {
        const novo = { ...atual };
        for (const m of marcados) if (!novo[m.user_id]) novo[m.user_id] = m;
        return novo;
      });
    }
    fecharPostarModal();
  }

  function resolverAutorPost(autorId) {
    if (autorId === session.user.id) return perfilProprio;
    return perfisPorId[autorId] || null;
  }

  function resolverPerfilMarcado(usuarioId) {
    if (usuarioId === session.user.id) return perfilProprio;
    return perfisPorId[usuarioId] || perfisMarcados[usuarioId] || null;
  }

  function extrairCaminhoStorage(url) {
    const marcador = "/object/public/posts/";
    const idx = url.indexOf(marcador);
    if (idx === -1) return null;
    return url.slice(idx + marcador.length);
  }

  async function apagarPost(post) {
    if (apagandoPost) return;
    if (!window.confirm("Excluir esta publicação?")) return;
    setApagandoPost(post.id);
    const caminho = extrairCaminhoStorage(post.imagem_url);
    if (caminho) {
      const { error: erroStorage } = await supabase.storage.from("posts").remove([caminho]);
      if (erroStorage) console.error("Erro ao remover arquivo do post:", erroStorage);
    }
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    setApagandoPost(null);
    if (error) {
      console.error("Erro ao apagar post:", error);
      alert("Não foi possível apagar a publicação. Tente novamente.");
      return;
    }
    setPosts((atual) => atual.filter((p) => p.id !== post.id));
  }

  async function alternarCurtida(post) {
    if (curtindoPost === post.id) return;
    setCurtindoPost(post.id);
    const jaCurtiu = !!curtidoPorMim[post.id];
    if (jaCurtiu) {
      const { error } = await supabase
        .from("curtidas_post")
        .delete()
        .eq("post_id", post.id)
        .eq("usuario_id", session.user.id);
      setCurtindoPost(null);
      if (error) {
        console.error("Erro ao remover curtida:", error);
        alert("Não foi possível remover a curtida. Tente novamente.");
        return;
      }
      setCurtidoPorMim((atual) => {
        const novo = { ...atual };
        delete novo[post.id];
        return novo;
      });
      setCurtidasPorPost((atual) => ({
        ...atual,
        [post.id]: Math.max(0, (atual[post.id] || 1) - 1),
      }));
    } else {
      const { error } = await supabase
        .from("curtidas_post")
        .insert({ post_id: post.id, usuario_id: session.user.id });
      setCurtindoPost(null);
      if (error && error.code !== "23505") {
        console.error("Erro ao curtir:", error);
        alert("Não foi possível curtir. Tente novamente.");
        return;
      }
      setCurtidoPorMim((atual) => ({ ...atual, [post.id]: true }));
      if (!error) {
        setCurtidasPorPost((atual) => ({ ...atual, [post.id]: (atual[post.id] || 0) + 1 }));
      }
    }
  }

  function alternarComentariosPost(postId) {
    if (postComentariosAberto === postId) {
      setPostComentariosAberto(null);
      return;
    }
    setPostComentariosAberto(postId);
    setNovoComentarioPost("");
    if (!comentariosPorPost[postId]) {
      carregarComentariosPost(postId);
    }
  }

  async function carregarComentariosPost(postId) {
    setCarregandoComentariosPost(postId);
    const { data, error } = await supabase
      .from("comentarios_post")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setCarregandoComentariosPost(null);
    if (error) {
      console.error("Erro ao carregar comentários do post:", error);
      return;
    }
    const lista = data || [];
    setComentariosPorPost((atual) => ({ ...atual, [postId]: lista }));
    const idsFaltando = [
      ...new Set(
        lista
          .map((c) => c.autor_id)
          .filter(
            (autorId) =>
              autorId !== session.user.id &&
              !perfisPorId[autorId] &&
              !perfisAutoresComentariosPost[autorId]
          )
      ),
    ];
    if (idsFaltando.length === 0) return;
    const { data: perfisData, error: erroPerfis } = await supabase
      .from("perfis")
      .select("user_id, nick, nome, avatar_url")
      .in("user_id", idsFaltando);
    if (erroPerfis) {
      console.error("Erro ao carregar perfis dos autores dos comentários:", erroPerfis);
      return;
    }
    setPerfisAutoresComentariosPost((atual) => {
      const novo = { ...atual };
      for (const p of perfisData || []) novo[p.user_id] = p;
      return novo;
    });
  }

  function resolverAutorComentarioPost(autorId) {
    if (autorId === session.user.id) return perfilProprio;
    return perfisPorId[autorId] || perfisAutoresComentariosPost[autorId] || null;
  }

  async function enviarComentarioPost(postId) {
    if (enviandoComentarioPost) return;
    const texto = novoComentarioPost.trim();
    if (!texto || texto.length > 300) return;
    setEnviandoComentarioPost(true);
    const { data, error } = await supabase
      .from("comentarios_post")
      .insert({ post_id: postId, autor_id: session.user.id, mensagem: texto })
      .select()
      .single();
    setEnviandoComentarioPost(false);
    if (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Não foi possível enviar o comentário. Tente novamente.");
      return;
    }
    setComentariosPorPost((atual) => ({
      ...atual,
      [postId]: [data, ...(atual[postId] || [])],
    }));
    setComentariosContagemPorPost((atual) => ({ ...atual, [postId]: (atual[postId] || 0) + 1 }));
    setNovoComentarioPost("");
  }

  async function apagarComentarioPost(postId, comentarioId) {
    if (apagandoComentarioPost) return;
    setApagandoComentarioPost(comentarioId);
    const { error } = await supabase.from("comentarios_post").delete().eq("id", comentarioId);
    setApagandoComentarioPost(null);
    if (error) {
      console.error("Erro ao apagar comentário:", error);
      alert("Não foi possível apagar o comentário. Tente novamente.");
      return;
    }
    setComentariosPorPost((atual) => ({
      ...atual,
      [postId]: (atual[postId] || []).filter((c) => c.id !== comentarioId),
    }));
    setComentariosContagemPorPost((atual) => ({
      ...atual,
      [postId]: Math.max(0, (atual[postId] || 1) - 1),
    }));
  }

  function handleVerComentariosProprio(filme) {
    fecharDetalhe();
    setTimeout(() => abrirComentariosFilme(filme), 260);
  }

  function abrirRoleta() {
    setRoletaAberta(true);
    requestAnimationFrame(() => setRoletaVisivel(true));
  }

  function fecharRoleta() {
    setRoletaVisivel(false);
    setTimeout(() => setRoletaAberta(false), 250);
  }

  function verDetalhesDaRoleta(filme) {
    setRoletaVisivel(false);
    setRoletaAberta(false);
    abrirDetalhe(filme);
  }

  function celebrar() {
    setConfeteAtivo(true);
  }

  async function confirmarAdicao(status) {
    if (!selecionado || salvando) return;
    if (status === "assistido" && nota && !notaEhValida(nota)) {
      alert("A nota deve ser um número inteiro entre 1 e 10.");
      return;
    }
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
      vote_average: typeof detalhes.voteAverage === "number" ? detalhes.voteAverage : null,
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
    const { data, error } = await supabase
      .from("filmes")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select();
    if (error) {
      console.error("Erro ao remover filme:", error);
      alert("Não foi possível remover o filme. Tente novamente.");
      return;
    }
    if (!data || data.length === 0) {
      console.error("Delete não afetou nenhuma linha (possível policy de DELETE ausente no Supabase):", {
        id,
        user_id: session.user.id,
      });
      alert(
        "O filme não foi removido — o Supabase não confirmou a exclusão (provável falta de policy de DELETE). Veja o console."
      );
      return;
    }
    setFilmes(filmes.filter((f) => f.id !== id));
  }

  async function avaliar(id, valor) {
    if (!Number.isInteger(valor) || valor < 1 || valor > 10) return false;
    const { error } = await supabase
      .from("filmes")
      .update({ rating: valor, status: "assistido" })
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (error) {
      console.error("Erro ao avaliar filme:", error);
      alert("Não foi possível salvar a nota. Tente novamente.");
      return false;
    }
    setFilmes(
      filmes.map((f) => (f.id === id ? { ...f, rating: valor, status: "assistido" } : f))
    );
    setDetalheAberto((atual) =>
      atual && atual.id === id ? { ...atual, rating: valor, status: "assistido" } : atual
    );
    if (valor === 10) celebrar();
    return true;
  }

  async function moverParaQuero(id) {
    const { error } = await supabase
      .from("filmes")
      .update({ status: "quero", rating: null })
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (error) {
      console.error("Erro ao mover filme:", error);
      alert("Não foi possível mover o filme. Tente novamente.");
      return false;
    }
    setFilmes(filmes.map((f) => (f.id === id ? { ...f, status: "quero", rating: null } : f)));
    setDetalheAberto((atual) =>
      atual && atual.id === id ? { ...atual, status: "quero", rating: null } : atual
    );
    return true;
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
      vote_average: typeof detalhes.voteAverage === "number" ? detalhes.voteAverage : null,
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
    setSugestoesGenero((atual) => atual.filter((r) => r.id !== item.id));
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

  if (carregandoPerfil) {
    return (
      <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] flex items-center justify-center">
        <p className="text-[#8A857C] text-sm">Carregando...</p>
      </div>
    );
  }

  if (!perfilProprio) {
    return (
      <EscolherNick
        session={session}
        onCriado={(perfil) => setPerfilProprio(perfil)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#12100E] text-[#F1EEE6] p-6">
      <div className="max-w-md mx-auto pb-24 sm:pb-20">
        <header className="flex items-center justify-between gap-2 mb-8 pt-1">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[#D97757]" />
            <h1 className="text-2xl font-bold tracking-wide">MINHA FILMOTECA</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={abrirNotificacoes}
              aria-label="Notificações"
              className="relative text-[#8A857C] hover:text-[#F1EEE6] transition p-1"
            >
              <Bell className="w-4 h-4" />
              {contagemNaoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-medium flex items-center justify-center">
                  {contagemNaoLidas > 9 ? "9+" : contagemNaoLidas}
                </span>
              )}
            </button>
            <button
              onClick={abrirPerfilModal}
              aria-label="Meu perfil"
              className="w-7 h-7 rounded-full overflow-hidden bg-[#1B1815] border border-[#2A2622] flex items-center justify-center shrink-0"
            >
              {perfilProprio?.avatar_url ? (
                <img
                  src={perfilProprio.avatar_url}
                  alt="Meu avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-[#8A857C]" />
              )}
            </button>
            <button
              onClick={handleLogout}
              aria-label="Sair"
              className="text-[#8A857C] hover:text-[#F1EEE6] transition p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="hidden sm:flex gap-1 mb-6 bg-[#1B1815] rounded-lg p-1 border border-[#2A2622]">
          {ABAS.map((t) => (
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
            <div className="space-y-8">
              <SectionTitle icon={BarChart}>Estatísticas</SectionTitle>

              {topAvaliados.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#8A857C] mb-3 uppercase tracking-wider">
                    Seus melhores avaliados
                  </p>
                  <div className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-1 -mx-1 px-1">
                    {topAvaliados.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => abrirDetalhe(f)}
                        className="shrink-0 w-32 text-left group"
                      >
                        <div className="relative rounded-lg overflow-hidden border border-[#2A2622] shadow-lg shadow-black/30 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-black/50">
                          <img
                            src={f.poster}
                            alt={f.title}
                            className="w-full aspect-[2/3] object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-5 pb-1.5 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-[#D97757] text-[#D97757]" />
                            <span className="text-sm font-bold">{f.rating}/10</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium mt-1.5 truncate">{f.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  <p className="text-xs font-semibold text-[#8A857C] mb-3 uppercase tracking-wider">
                    Destaque
                  </p>
                  <div className="flex items-center gap-3 bg-[#1B1815] rounded-lg border border-[#D97757] p-3">
                    <img
                      src={destaque.poster}
                      alt={destaque.title}
                      className="w-14 h-20 object-cover rounded-lg"
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
                <p className="text-xs font-semibold text-[#8A857C] mb-3 uppercase tracking-wider">
                  Distribuição por gênero
                </p>
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

              <div>
                <p className="text-xs font-semibold text-[#8A857C] mb-3 uppercase tracking-wider">
                  Conquistas
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {BADGES.map((b) => {
                    const desbloqueada = badgesParaExibir.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className={`relative rounded-lg border p-3 flex flex-col items-center text-center gap-1 transition ${
                          desbloqueada
                            ? "bg-[#1B1815] border-[#D97757]"
                            : "bg-[#1B1815] border-[#2A2622] opacity-40 grayscale"
                        }`}
                      >
                        {!desbloqueada && (
                          <Lock className="w-3 h-3 text-[#8A857C] absolute top-1.5 right-1.5" />
                        )}
                        <span className="text-2xl">{b.emoji}</span>
                        <p className="text-[11px] font-medium leading-tight">{b.nome}</p>
                        <p className="text-[9px] text-[#8A857C] leading-tight">{b.descricao}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : aba === "descobrir" ? (
            <div>
              <SectionTitle icon={Compass}>Descobrir</SectionTitle>
              <button
                onClick={abrirIdentificarModal}
                className="w-full mb-3 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg bg-[#1B1815] border border-[#2A2622] hover:border-[#D97757] hover:scale-[1.01] transition"
              >
                📷 Identificar Filme/Série/Anime
              </button>
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1">
                <button
                  onClick={() => selecionarGenero("anime")}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition ${
                    generoSelecionado === "anime"
                      ? "bg-[#D97757] text-[#12100E] ring-2 ring-[#D97757]/50 ring-offset-2 ring-offset-[#12100E]"
                      : "bg-[#D97757]/10 border border-[#D97757]/50 text-[#D97757] hover:bg-[#D97757]/20"
                  }`}
                >
                  🎌 Anime
                </button>
                {GENEROS_TMDB.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selecionarGenero(g.id)}
                    className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition ${
                      generoSelecionado === g.id
                        ? "bg-[#D97757] text-[#12100E]"
                        : "bg-[#1B1815] border border-[#2A2622] text-[#8A857C] hover:border-[#D97757]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {generoSelecionado !== null && (
                <button
                  onClick={limparFiltroGenero}
                  className="text-xs text-[#8A857C] hover:text-[#F1EEE6] transition mb-3"
                >
                  Limpar filtro
                </button>
              )}

              {generoSelecionado === null && candidatosRecomendacao.length === 0 ? (
                <p className="text-[#8A857C] text-center py-16 text-sm">
                  Avalie alguns filmes com nota alta para receber recomendações.
                </p>
              ) : carregandoDescobrir ? (
                <div className="flex items-center justify-center gap-2 py-16">
                  <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
                  <span className="text-xs text-[#8A857C]">
                    {generoSelecionado !== null
                      ? "Buscando sugestões..."
                      : "Buscando recomendações..."}
                  </span>
                </div>
              ) : itensDescobrir.length === 0 ? (
                <p className="text-[#8A857C] text-center py-16 text-sm">
                  {generoSelecionado !== null
                    ? "Nenhuma sugestão encontrada para esse gênero."
                    : "Nenhuma recomendação encontrada por enquanto."}
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-1 -mx-1 px-1">
                  {itensDescobrir.map((item) => (
                    <div
                      key={item.id}
                      className="shrink-0 w-52 bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622] shadow-lg shadow-black/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-black/50"
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
                          className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg bg-[#2A2622] hover:bg-[#D97757] hover:text-[#12100E] hover:scale-[1.02] transition disabled:opacity-60"
                        >
                          <Plus className="w-3 h-3" />
                          {salvandoRecomendacao === item.id ? "Adicionando..." : "Quero ver"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {generoSelecionado !== null && itensDescobrir.length > 0 && !carregandoDescobrir && (
                semMaisGenero ? (
                  <p className="text-xs text-[#8A857C] text-center mt-3">
                    Não há mais sugestões para esse gênero no momento.
                  </p>
                ) : (
                  <button
                    onClick={carregarMaisGenero}
                    disabled={carregandoMaisGenero}
                    className="w-full mt-4 text-sm font-medium py-2 rounded-lg bg-[#1B1815] border border-[#2A2622] hover:border-[#D97757] hover:scale-[1.01] transition disabled:opacity-60"
                  >
                    {carregandoMaisGenero ? "Carregando..." : "Carregar mais"}
                  </button>
                )
              )}
            </div>
          ) : aba === "feed" ? (
            <div>
              <SectionTitle icon={Camera}>Feed</SectionTitle>

              <button
                onClick={abrirPostarModal}
                className="w-full mb-4 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg bg-[#D97757] text-[#12100E] hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition"
              >
                <Camera className="w-4 h-4" />
                Postar foto
              </button>

              {carregandoPosts ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-[#1B1815] rounded-lg border border-[#2A2622] overflow-hidden"
                    >
                      <div className="w-full aspect-square bg-[#2A2622] animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <p className="text-[#8A857C] text-center py-16 text-sm">
                  Nenhuma publicação ainda. Siga amigos ou publique algo!
                </p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const autor = resolverAutorPost(post.autor_id);
                    const podeApagar = post.autor_id === session.user.id;
                    return (
                      <div
                        key={post.id}
                        className="bg-[#1B1815] rounded-lg border border-[#2A2622] shadow-lg shadow-black/30 overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-8 h-8 rounded-full overflow-hidden bg-[#12100E] border border-[#2A2622] flex items-center justify-center shrink-0">
                              {autor?.avatar_url ? (
                                <img
                                  src={autor.avatar_url}
                                  alt={autor.nick}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-[#8A857C]" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {autor?.nome || autor?.nick || "..."}
                              </p>
                              <p className="text-[10px] text-[#8A857C]">
                                {formatarTempoRelativo(post.created_at)}
                              </p>
                            </div>
                          </div>
                          {podeApagar && (
                            <button
                              onClick={() => apagarPost(post)}
                              disabled={apagandoPost === post.id}
                              aria-label="Excluir publicação"
                              className="text-[#8A857C] hover:text-red-400 transition disabled:opacity-60 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <img
                          src={post.imagem_url}
                          alt="Publicação"
                          className="w-full aspect-square object-cover"
                        />

                        <div className="flex items-center gap-1.5 px-3 pt-2">
                          <button
                            onClick={() => alternarCurtida(post)}
                            disabled={curtindoPost === post.id}
                            className="flex items-center gap-1.5 text-sm disabled:opacity-60"
                          >
                            <Heart
                              className={`w-5 h-5 transition ${
                                curtidoPorMim[post.id]
                                  ? "fill-[#D97757] text-[#D97757]"
                                  : "text-[#8A857C]"
                              }`}
                            />
                            <span
                              className={
                                curtidoPorMim[post.id]
                                  ? "text-[#D97757] font-medium"
                                  : "text-[#8A857C]"
                              }
                            >
                              {curtidasPorPost[post.id] || 0} curtidas
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={() => alternarComentariosPost(post.id)}
                          className="text-xs text-[#8A857C] hover:text-[#F1EEE6] transition px-3 pt-1 pb-2"
                        >
                          {(comentariosContagemPorPost[post.id] || 0) > 0
                            ? `Ver ${comentariosContagemPorPost[post.id]} comentário${
                                comentariosContagemPorPost[post.id] > 1 ? "s" : ""
                              }`
                            : "Comentar"}
                        </button>

                        {post.legenda && (
                          <p className="text-sm px-3 pb-3 break-words">{post.legenda}</p>
                        )}

                        {(marcacoesPorPost[post.id] || []).length > 0 && (
                          <p className="text-xs text-[#8A857C] px-3 pb-3 -mt-2 break-words">
                            com{" "}
                            {marcacoesPorPost[post.id].map((usuarioId, i) => {
                              const perfilMarcado = resolverPerfilMarcado(usuarioId);
                              return (
                                <span key={usuarioId} className="text-[#D97757]">
                                  @{perfilMarcado?.nick || "..."}
                                  {i < marcacoesPorPost[post.id].length - 1 ? ", " : ""}
                                </span>
                              );
                            })}
                          </p>
                        )}

                        {postComentariosAberto === post.id && (
                          <div className="border-t border-[#2A2622] p-3">
                            <div className="mb-3">
                              <textarea
                                value={novoComentarioPost}
                                onChange={(e) =>
                                  setNovoComentarioPost(e.target.value.slice(0, 300))
                                }
                                maxLength={300}
                                rows={2}
                                disabled={enviandoComentarioPost}
                                placeholder="Escreva um comentário..."
                                className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757] resize-none disabled:opacity-60"
                              />
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-[#8A857C]">
                                  {novoComentarioPost.length}/300
                                </span>
                                <button
                                  onClick={() => enviarComentarioPost(post.id)}
                                  disabled={enviandoComentarioPost || !novoComentarioPost.trim()}
                                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[#D97757] text-[#12100E] hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
                                >
                                  {enviandoComentarioPost ? "Enviando..." : "Enviar"}
                                </button>
                              </div>
                            </div>

                            {carregandoComentariosPost === post.id ? (
                              <p className="text-xs text-[#8A857C]">Carregando comentários...</p>
                            ) : (comentariosPorPost[post.id] || []).length === 0 ? (
                              <p className="text-xs text-[#8A857C]">Nenhum comentário ainda.</p>
                            ) : (
                              <div className="space-y-2">
                                {(comentariosPorPost[post.id] || []).map((c) => {
                                  const autorComentario = resolverAutorComentarioPost(
                                    c.autor_id
                                  );
                                  const podeApagarComentario =
                                    post.autor_id === session.user.id ||
                                    c.autor_id === session.user.id;
                                  return (
                                    <div
                                      key={c.id}
                                      className="bg-[#12100E] border border-[#2A2622] rounded-lg p-3"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className="w-7 h-7 rounded-full overflow-hidden bg-[#1B1815] border border-[#2A2622] flex items-center justify-center shrink-0">
                                          {autorComentario?.avatar_url ? (
                                            <img
                                              src={autorComentario.avatar_url}
                                              alt={autorComentario.nick}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <User className="w-3.5 h-3.5 text-[#8A857C]" />
                                          )}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-medium truncate">
                                              {autorComentario?.nome ||
                                                autorComentario?.nick ||
                                                "..."}
                                            </p>
                                            {podeApagarComentario && (
                                              <button
                                                onClick={() =>
                                                  apagarComentarioPost(post.id, c.id)
                                                }
                                                disabled={apagandoComentarioPost === c.id}
                                                aria-label="Excluir comentário"
                                                className="text-[#8A857C] hover:text-red-400 transition disabled:opacity-60 shrink-0"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-sm mt-0.5 break-words">
                                            {c.mensagem}
                                          </p>
                                          <p className="text-[10px] text-[#8A857C] mt-1">
                                            {formatarTempoRelativo(c.created_at)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : aba === "amigos" ? (
            amigoSelecionado !== null ? (
              <div>
                <button
                  onClick={() => setAmigoSelecionado(null)}
                  className="flex items-center gap-1 text-xs text-[#8A857C] hover:text-[#F1EEE6] transition mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <p className="text-sm font-medium mb-3 truncate">
                  Assistidos de{" "}
                  {perfisPorId[amigoSelecionado]?.nome ||
                    perfisPorId[amigoSelecionado]?.nick ||
                    "..."}
                </p>
                {carregandoAssistidosAmigo ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }, (_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (assistidosDoAmigo[amigoSelecionado] || []).length === 0 ? (
                  <p className="text-[#8A857C] text-center py-16 text-sm">
                    Esse amigo ainda não tem nada assistido.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {assistidosDoAmigo[amigoSelecionado].map((f) => (
                      <div
                        key={f.id}
                        onClick={() => abrirComentariosFilme(f)}
                        className="bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622] shadow-lg shadow-black/30 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-black/50 active:scale-95"
                      >
                        <img
                          src={f.poster}
                          alt={f.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                        <div className="p-3">
                          <p className="font-medium text-sm leading-tight">{f.title}</p>
                          <p className="text-xs text-[#8A857C] mt-0.5">{f.year}</p>
                          <div className="flex items-center gap-1 mt-2 text-[#D97757] font-medium text-sm">
                            <Star className="w-3.5 h-3.5 fill-[#D97757]" />
                            {f.rating ?? "—"}/10
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={buscaNickAmigo}
                    onChange={(e) => setBuscaNickAmigo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") seguirUsuario();
                    }}
                    placeholder="Nick do seu amigo"
                    className="flex-1 bg-[#1B1815] border border-[#2A2622] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
                  />
                  <button
                    onClick={seguirUsuario}
                    disabled={buscandoAmigo}
                    className="px-4 text-sm font-medium rounded-lg bg-[#D97757] text-[#12100E] hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
                  >
                    {buscandoAmigo ? "Buscando..." : "Seguir"}
                  </button>
                </div>
                {erroBuscaAmigo && (
                  <p className="text-xs text-red-400 mb-3">{erroBuscaAmigo}</p>
                )}

                <div className="flex gap-2 mb-4 mt-6">
                  <button
                    onClick={() => setSubAbaAmigos("seguindo")}
                    className={`flex-1 text-sm font-medium py-2 rounded-lg transition ${
                      subAbaAmigos === "seguindo"
                        ? "bg-[#D97757] text-[#12100E]"
                        : "bg-[#1B1815] border border-[#2A2622] text-[#8A857C] hover:text-[#F1EEE6]"
                    }`}
                  >
                    Seguindo ({seguindo.length})
                  </button>
                  <button
                    onClick={() => setSubAbaAmigos("seguidores")}
                    className={`flex-1 text-sm font-medium py-2 rounded-lg transition ${
                      subAbaAmigos === "seguidores"
                        ? "bg-[#D97757] text-[#12100E]"
                        : "bg-[#1B1815] border border-[#2A2622] text-[#8A857C] hover:text-[#F1EEE6]"
                    }`}
                  >
                    Seguidores ({seguidores.length})
                  </button>
                </div>

                {subAbaAmigos === "seguindo" ? (
                  seguindo.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                      <Users className="w-8 h-8 text-[#8A857C] mb-2" />
                      <p className="text-[#8A857C] text-sm">Você ainda não segue ninguém.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {seguindo.map((s) => {
                        const perfil = perfisPorId[s.seguido_id];
                        return (
                        <div
                          key={s.seguido_id}
                          className="flex items-center justify-between bg-[#1B1815] border border-[#2A2622] rounded-lg p-3"
                        >
                          <button
                            onClick={() => abrirAmigo(s.seguido_id)}
                            className="flex items-center gap-2 text-sm text-left flex-1 hover:text-[#D97757] transition truncate min-w-0"
                          >
                            <span className="w-7 h-7 rounded-full overflow-hidden bg-[#12100E] border border-[#2A2622] flex items-center justify-center shrink-0">
                              {perfil?.avatar_url ? (
                                <img
                                  src={perfil.avatar_url}
                                  alt={perfil.nick}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5 text-[#8A857C]" />
                              )}
                            </span>
                            <span className="truncate">
                              {perfil ? perfil.nome || perfil.nick : "Carregando..."}
                            </span>
                          </button>
                          <button
                            onClick={() => deixarDeSeguir(s.seguido_id)}
                            disabled={deixandoDeSeguir === s.seguido_id}
                            className="text-xs text-[#8A857C] hover:text-[#F1EEE6] transition disabled:opacity-60 shrink-0 ml-2"
                          >
                            {deixandoDeSeguir === s.seguido_id ? "Removendo..." : "Deixar de seguir"}
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  )
                ) : carregandoSeguidores ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
                    <span className="text-xs text-[#8A857C]">Carregando...</span>
                  </div>
                ) : seguidores.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Users className="w-8 h-8 text-[#8A857C] mb-2" />
                    <p className="text-[#8A857C] text-sm">Ninguém te segue ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {seguidores.map((s) => {
                      const perfil = perfisPorId[s.seguidor_id];
                      const jaSigo = seguindo.some((f) => f.seguido_id === s.seguidor_id);
                      return (
                        <div
                          key={s.seguidor_id}
                          className="flex items-center justify-between bg-[#1B1815] border border-[#2A2622] rounded-lg p-3"
                        >
                          <button
                            onClick={() => abrirAmigo(s.seguidor_id)}
                            className="flex items-center gap-2 text-sm text-left flex-1 hover:text-[#D97757] transition truncate min-w-0"
                          >
                            <span className="w-7 h-7 rounded-full overflow-hidden bg-[#12100E] border border-[#2A2622] flex items-center justify-center shrink-0">
                              {perfil?.avatar_url ? (
                                <img
                                  src={perfil.avatar_url}
                                  alt={perfil.nick}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5 text-[#8A857C]" />
                              )}
                            </span>
                            <span className="truncate">
                              {perfil ? perfil.nome || perfil.nick : "Carregando..."}
                            </span>
                          </button>
                          {jaSigo ? (
                            <span className="text-xs text-[#8A857C] shrink-0 ml-2">
                              Você já segue
                            </span>
                          ) : (
                            <button
                              onClick={() => seguirDeVolta(s.seguidor_id)}
                              disabled={seguindoDeVolta === s.seguidor_id}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#D97757] text-[#12100E] hover:bg-[#e5896d] transition disabled:opacity-60 shrink-0 ml-2"
                            >
                              {seguindoDeVolta === s.seguidor_id ? "Seguindo..." : "Seguir de volta"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ) : lista.length === 0 ? (
            <p className="text-[#8A857C] text-center py-16 text-sm">
              Nada por aqui ainda. Toque no + para adicionar.
            </p>
          ) : (
            <>
              {aba === "quero" && lista.length >= 2 && (
                <button
                  onClick={abrirRoleta}
                  className="w-full mb-3 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg bg-[#1B1815] border border-[#2A2622] hover:border-[#D97757] hover:scale-[1.01] transition"
                >
                  🎲 Sortear
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                {lista.map((f) => {
                  const providers = providersMap[`${f.id}-${f.media_type}`];
                  const destaqueProvider =
                    providers?.flatrate?.[0] || providers?.rent?.[0] || providers?.buy?.[0];
                  return (
                    <div
                      key={f.id}
                      onClick={() => abrirDetalhe(f)}
                      className="group relative bg-[#1B1815] rounded-lg overflow-hidden border border-[#2A2622] shadow-lg shadow-black/30 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-black/50 hover:z-10 active:scale-95"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remover(f.id);
                        }}
                        aria-label="Remover filme"
                        className="absolute top-1 right-1 z-10 w-11 h-11 flex items-center justify-center"
                      >
                        <span className="bg-black/60 rounded-full p-1.5">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      </button>
                      <div className="relative">
                        <img
                          src={f.poster}
                          alt={f.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                        {f.vote_average != null && (
                          <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/60 text-[10px] text-[#F1EEE6] px-1.5 py-0.5 rounded-full">
                            <Globe className="w-2.5 h-2.5" />
                            {f.vote_average.toFixed(1)}
                          </div>
                        )}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirAvaliarModal(f);
                            }}
                            className="mt-2 w-full text-xs font-medium py-1.5 rounded-lg bg-[#D97757] text-[#12100E] hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition"
                          >
                            Já assisti
                          </button>
                        )}
                      </div>
                    </div>
                );
                })}
              </div>
            </>
          )}
        </div>

        <button
          onClick={abrirModalAdicionar}
          className="fixed bottom-24 sm:bottom-6 right-6 bg-[#D97757] text-[#12100E] rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-black/40 hover:scale-105 hover:shadow-xl hover:shadow-[#D97757]/30 active:scale-95 transition z-40"
          aria-label="Adicionar filme"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <nav className="hidden max-sm:flex fixed inset-x-0 bottom-0 w-full z-40 bg-[#1B1815] border-t border-[#2A2622] pb-[env(safe-area-inset-bottom)]">
        {ABAS.map((t) => {
          const Icon = t.Icon;
          const ativo = aba === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition ${
                ativo ? "text-[#D97757]" : "text-[#8A857C]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {modalAberto && (
        <div
          className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
            modalVisivel ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-[#1B1815] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
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
                    className="w-full bg-[#12100E] border border-[#2A2622] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#D97757]"
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
                      className="w-full flex items-center gap-3 bg-[#12100E] border border-[#2A2622] rounded-lg p-2 hover:border-[#D97757] transition text-left"
                    >
                      <img src={r.poster} alt={r.title} className="w-10 h-14 object-cover rounded-md" />
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
                    className="w-16 h-24 object-cover rounded-md"
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

                <label className="text-xs text-[#8A857C] mb-1 block">
                  Já assistiu? Dê uma nota (opcional)
                </label>
                <div className="mb-4">
                  <RatingInput value={nota} onChange={setNota} disabled={salvando} />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => confirmarAdicao("quero")}
                    disabled={salvando}
                    className="flex-1 border border-[#2A2622] text-[#F1EEE6] font-medium py-2 rounded-lg hover:border-[#D97757] hover:scale-[1.02] transition disabled:opacity-60"
                  >
                    Quero assistir
                  </button>
                  <button
                    onClick={() => confirmarAdicao("assistido")}
                    disabled={salvando || (nota !== "" && !notaEhValida(nota))}
                    className="flex-1 bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
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
        <DetailsModal
          filme={detalheAberto}
          visivel={detalheVisivel}
          onClose={fecharDetalhe}
          onAvaliar={avaliar}
          onMoverParaQuero={moverParaQuero}
          onVerComentarios={handleVerComentariosProprio}
        />
      )}

      {comentarioFilmeAberto && (
        <ComentariosFilmeModal
          filme={comentarioFilmeAberto}
          visivel={comentarioFilmeVisivel}
          onClose={fecharComentariosFilme}
          sessionUserId={session.user.id}
          perfilProprio={perfilProprio}
          perfisConhecidos={perfisPorId}
        />
      )}

      {avaliarModalAberto && (
        <AvaliarModal
          filme={avaliarModalAberto}
          visivel={avaliarModalVisivel}
          onClose={fecharAvaliarModal}
          onAvaliar={avaliar}
        />
      )}

      {postarModalAberto && (
        <PostarModal
          visivel={postarModalVisivel}
          onClose={fecharPostarModal}
          sessionUserId={session.user.id}
          accessToken={session.access_token}
          onPostado={handlePostado}
        />
      )}

      {notificacaoModalAberto && (
        <NotificacoesModal
          visivel={notificacaoModalVisivel}
          onClose={fecharNotificacoes}
          sessionUserId={session.user.id}
          onAbrirFilme={abrirComentariosPorId}
          onIrParaFeed={() => setAba("feed")}
        />
      )}

      {confeteAtivo && <Confete onFim={() => setConfeteAtivo(false)} />}

      {mostrarOnboarding && <Onboarding onFinalizar={finalizarOnboarding} />}

      {roletaAberta && (
        <Roleta
          lista={filmes.filter((f) => f.status === "quero")}
          visivel={roletaVisivel}
          onClose={fecharRoleta}
          onVerDetalhes={verDetalhesDaRoleta}
        />
      )}

      {identificarModalAberto && (
        <IdentificarModal
          visivel={identificarModalVisivel}
          onClose={fecharIdentificarModal}
          onIdentificado={handleTituloIdentificado}
        />
      )}

      {toastConquistas && (
        <ToastConquistas
          badges={toastConquistas}
          onFechar={() => setToastConquistas(null)}
        />
      )}

      {perfilModalAberto && (
        <PerfilModal
          perfil={perfilProprio}
          visivel={perfilModalVisivel}
          onClose={fecharPerfilModal}
          onSalvar={(novoPerfil) => setPerfilProprio(novoPerfil)}
        />
      )}
    </div>
  );
}