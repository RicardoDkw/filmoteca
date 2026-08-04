import { NextResponse } from "next/server";

const CRUNCHYROLL_PROVIDER_ID = 283;

function intercalar(a, b) {
  const resultado = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) resultado.push(a[i]);
    if (b[i]) resultado.push(b[i]);
  }
  return resultado;
}

function mapear(r, mediaType) {
  return {
    id: r.id,
    title: r.title || r.name,
    year: (r.release_date || r.first_air_date || "").slice(0, 4) || "—",
    poster: `https://image.tmdb.org/t/p/w342${r.poster_path}`,
    mediaType,
    overview: r.overview || "",
  };
}

async function buscarPagina({ comCrunchyroll, page }) {
  const params = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    with_genres: "16",
    with_origin_country: "JP",
    sort_by: "popularity.desc",
    language: "pt-BR",
    page: String(page),
  });
  if (comCrunchyroll) {
    params.set("with_watch_providers", String(CRUNCHYROLL_PROVIDER_ID));
    params.set("watch_region", "BR");
  }

  const [movieRes, tvRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/discover/movie?${params.toString()}`),
    fetch(`https://api.themoviedb.org/3/discover/tv?${params.toString()}`),
  ]);

  const [movieData, tvData] = await Promise.all([
    movieRes.ok ? movieRes.json() : { results: [] },
    tvRes.ok ? tvRes.json() : { results: [] },
  ]);

  const movies = (movieData.results || [])
    .filter((r) => r.poster_path)
    .map((r) => mapear(r, "movie"));
  const tv = (tvData.results || [])
    .filter((r) => r.poster_path)
    .map((r) => mapear(r, "tv"));

  return intercalar(tv, movies);
}

function dedupEExcluir(itens, excluidos) {
  const idsUsados = new Set();
  const resultados = [];
  for (const item of itens) {
    if (excluidos.has(item.id) || idsUsados.has(item.id)) continue;
    idsUsados.add(item.id);
    resultados.push(item);
  }
  return resultados;
}

export async function POST(request) {
  const { excluirIds, page } = await request.json();
  const paginaTmdb = Number(page) > 0 ? Number(page) : 1;
  const excluidos = new Set(excluirIds || []);

  const comFiltro = dedupEExcluir(
    await buscarPagina({ comCrunchyroll: true, page: paginaTmdb }),
    excluidos
  );

  if (comFiltro.length >= 5) {
    return NextResponse.json({ results: comFiltro.slice(0, 12) });
  }

  // poucos resultados disponíveis na Crunchyroll: cai pro fallback só com animação + Japão
  const semFiltro = dedupEExcluir(
    await buscarPagina({ comCrunchyroll: false, page: paginaTmdb }),
    excluidos
  );
  return NextResponse.json({ results: semFiltro.slice(0, 12) });
}
