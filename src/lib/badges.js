function contarAssistidos(filmes, predicado) {
  return filmes.filter((f) => f.status === "assistido" && predicado(f)).length;
}

// existe alguma janela de 7 dias com N ou mais filmes adicionados?
function temMaratona(filmes, minimo, janelaDias) {
  const tempos = filmes
    .map((f) => new Date(f.created_at).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  const janelaMs = janelaDias * 24 * 60 * 60 * 1000;
  let inicio = 0;
  for (let fim = 0; fim < tempos.length; fim++) {
    while (tempos[fim] - tempos[inicio] > janelaMs) inicio++;
    if (fim - inicio + 1 >= minimo) return true;
  }
  return false;
}

export const BADGES = [
  {
    id: "maratonista",
    emoji: "🎬",
    nome: "Maratonista",
    descricao: "5+ filmes na mesma semana",
    verificar: (filmes) => temMaratona(filmes, 5, 7),
  },
  {
    id: "cinefilo",
    emoji: "🍿",
    nome: "Cinéfilo",
    descricao: "25+ assistidos",
    verificar: (filmes) => contarAssistidos(filmes, () => true) >= 25,
  },
  {
    id: "fa_de_terror",
    emoji: "👻",
    nome: "Fã de Terror",
    descricao: "10+ terror assistidos",
    verificar: (filmes) =>
      contarAssistidos(filmes, (f) => (f.genres || []).includes("Terror")) >= 10,
  },
  {
    id: "critico_rigoroso",
    emoji: "⭐",
    nome: "Crítico Rigoroso",
    descricao: "Nota média < 6 (mín. 10 notas)",
    verificar: (filmes) => {
      const avaliados = filmes.filter((f) => f.status === "assistido" && f.rating != null);
      if (avaliados.length < 10) return false;
      const media = avaliados.reduce((soma, f) => soma + f.rating, 0) / avaliados.length;
      return media < 6;
    },
  },
  {
    id: "apaixonado",
    emoji: "💯",
    nome: "Apaixonado",
    descricao: "5+ notas 10",
    verificar: (filmes) => filmes.filter((f) => f.rating === 10).length >= 5,
  },
  {
    id: "otaku",
    emoji: "🎌",
    nome: "Otaku",
    descricao: "10+ animes assistidos",
    // sem coluna de país de origem salva, então a heurística usa gênero
    // Animação nos assistidos como aproximação razoável de "anime"
    verificar: (filmes) =>
      contarAssistidos(filmes, (f) => (f.genres || []).includes("Animação")) >= 10,
  },
];

export function calcularDesbloqueadas(filmes) {
  return BADGES.filter((b) => b.verificar(filmes)).map((b) => b.id);
}
