import { NextResponse } from "next/server";
import { GENERO_FILME_PARA_SERIE } from "@/lib/genres";

export async function POST(request) {
  const { genreId, excluirIds } = await request.json();

  if (!genreId) {
    return NextResponse.json({ results: [] });
  }

  const excluidos = new Set(excluirIds || []);
  const tvGenreId = GENERO_FILME_PARA_SERIE[genreId];

  const fontes = [
    {
      mediaType: "movie",
      url: `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&region=BR&language=pt-BR&page=1`,
    },
  ];
  if (tvGenreId) {
    fontes.push({
      mediaType: "tv",
      url: `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&with_genres=${tvGenreId}&sort_by=popularity.desc&language=pt-BR&page=1`,
    });
  }

  const listas = await Promise.all(
    fontes.map(async ({ mediaType, url }) => {
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results || [])
        .filter((r) => r.poster_path)
        .map((r) => ({
          id: r.id,
          title: r.title || r.name,
          year: (r.release_date || r.first_air_date || "").slice(0, 4) || "—",
          poster: `https://image.tmdb.org/t/p/w342${r.poster_path}`,
          mediaType,
          overview: r.overview || "",
        }));
    })
  );

  const idsUsados = new Set();
  const resultados = [];
  for (const item of listas.flat()) {
    if (excluidos.has(item.id) || idsUsados.has(item.id)) continue;
    idsUsados.add(item.id);
    resultados.push(item);
  }

  return NextResponse.json({ results: resultados.slice(0, 12) });
}
