import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(
    query
  )}&language=pt-BR&include_adult=false`;

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  const data = await response.json();

  const results = data.results
    .filter((r) => r.poster_path && (r.media_type === "movie" || r.media_type === "tv"))
    .map((r) => ({
      id: r.id,
      title: r.title || r.name,
      year: (r.release_date || r.first_air_date || "").slice(0, 4) || "—",
      poster: `https://image.tmdb.org/t/p/w342${r.poster_path}`,
      mediaType: r.media_type,
      overview: r.overview || "",
    }));

  return NextResponse.json({ results });
}