import { NextResponse } from "next/server";

export async function POST(request) {
  const { referencias, excluirIds } = await request.json();

  if (!Array.isArray(referencias) || referencias.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const excluidos = new Set(excluirIds || []);

  const listas = await Promise.all(
    referencias.map(async (ref) => {
      if (!ref?.id || (ref.media_type !== "movie" && ref.media_type !== "tv")) return [];
      const url = `https://api.themoviedb.org/3/${ref.media_type}/${ref.id}/recommendations?api_key=${process.env.TMDB_API_KEY}&language=pt-BR`;
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
          mediaType: ref.media_type,
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
