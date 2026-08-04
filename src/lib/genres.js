// Lista oficial de gêneros de filme da TMDb (pt-BR), usada nos chips de categoria.
export const GENEROS_TMDB = [
  { id: 28, label: "Ação" },
  { id: 12, label: "Aventura" },
  { id: 16, label: "Animação" },
  { id: 35, label: "Comédia" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentário" },
  { id: 18, label: "Drama" },
  { id: 10751, label: "Família" },
  { id: 14, label: "Fantasia" },
  { id: 36, label: "História" },
  { id: 27, label: "Terror" },
  { id: 10402, label: "Música" },
  { id: 9648, label: "Mistério" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Ficção Científica" },
  { id: 53, label: "Suspense" },
  { id: 10752, label: "Guerra" },
  { id: 37, label: "Faroeste" },
];

// Nem todo gênero de filme tem equivalente direto nos gêneros de série da TMDb
// (que usam outra lista de ids). Gêneros sem entrada aqui buscam só filmes.
export const GENERO_FILME_PARA_SERIE = {
  28: 10759, // Ação -> Ação & Aventura
  12: 10759, // Aventura -> Ação & Aventura
  16: 16, // Animação
  35: 35, // Comédia
  80: 80, // Crime
  99: 99, // Documentário
  18: 18, // Drama
  10751: 10751, // Família
  14: 10765, // Fantasia -> Ficção científica & Fantasia
  878: 10765, // Ficção científica -> Ficção científica & Fantasia
  9648: 9648, // Mistério
  10752: 10768, // Guerra -> Guerra & Política
  37: 37, // Faroeste
};
