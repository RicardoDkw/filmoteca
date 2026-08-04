import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || (type !== "movie" && type !== "tv")) {
    return NextResponse.json({ genres: [] });
  }

  const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${process.env.TMDB_API_KEY}&language=pt-BR`;

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json({ genres: [] }, { status: 500 });
  }

  const data = await response.json();

  const genres = (data.genres || []).map((g) => g.name);

  return NextResponse.json({ genres });
}
