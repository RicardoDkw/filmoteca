import { NextResponse } from "next/server";

const VAZIO = { flatrate: [], rent: [], buy: [] };

function mapProviders(list) {
  return (list || []).map((p) => ({
    id: p.provider_id,
    name: p.provider_name,
    logo: `https://image.tmdb.org/t/p/w45${p.logo_path}`,
  }));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || (type !== "movie" && type !== "tv")) {
    return NextResponse.json(VAZIO);
  }

  const url = `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${process.env.TMDB_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(VAZIO, { status: 500 });
  }

  const data = await response.json();
  const br = data.results?.BR;

  if (!br) {
    return NextResponse.json(VAZIO);
  }

  return NextResponse.json({
    flatrate: mapProviders(br.flatrate),
    rent: mapProviders(br.rent),
    buy: mapProviders(br.buy),
  });
}
