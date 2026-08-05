"use client";

import { useEffect, useState } from "react";
import { Check, Globe, Star, X } from "lucide-react";
import RatingInput, { notaEhValida } from "@/components/RatingInput";

function GrupoProviders({ titulo, lista }) {
  if (!lista || lista.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-xs text-[#8A857C] mb-1.5">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {lista.map((p) => (
          <div
            key={p.id}
            title={p.name}
            className="flex items-center gap-1.5 bg-[#12100E] border border-[#2A2622] rounded-md px-2 py-1"
          >
            <img src={p.logo} alt={p.name} className="w-5 h-5 rounded" />
            <span className="text-xs">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DetailsModal({
  filme,
  visivel,
  onClose,
  onAvaliar,
  onMoverParaQuero,
  onVerComentarios,
}) {
  const [providers, setProviders] = useState(null);
  const [salvandoNota, setSalvandoNota] = useState(null);
  const [notaSalva, setNotaSalva] = useState(false);
  const [movendo, setMovendo] = useState(false);
  const [notaInput, setNotaInput] = useState(filme.rating != null ? String(filme.rating) : "");
  const carregando = providers === null;

  async function handleAvaliar() {
    if (!notaEhValida(notaInput) || salvandoNota !== null) return;
    const n = Number(notaInput);
    if (n === filme.rating) return;
    setSalvandoNota(n);
    const ok = await onAvaliar(filme.id, n);
    setSalvandoNota(null);
    if (ok) {
      setNotaSalva(true);
      setTimeout(() => setNotaSalva(false), 1000);
    }
  }

  async function handleMoverParaQuero() {
    if (movendo) return;
    setMovendo(true);
    const ok = await onMoverParaQuero(filme.id);
    if (ok) {
      onClose();
      return;
    }
    setMovendo(false);
  }

  useEffect(() => {
    let ativo = true;
    fetch(`/api/providers?id=${filme.id}&type=${filme.media_type}`)
      .then((res) => res.json())
      .then((data) => {
        if (ativo) setProviders(data);
      });
    return () => {
      ativo = false;
    };
  }, [filme.id, filme.media_type]);

  const semProviders =
    providers &&
    providers.flatrate.length === 0 &&
    providers.rent.length === 0 &&
    providers.buy.length === 0;

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-lg p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Detalhes</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <img
            src={filme.poster}
            alt={filme.title}
            className="w-20 h-28 object-cover rounded shrink-0"
          />
          <div>
            <p className="font-medium">{filme.title}</p>
            <p className="text-xs text-[#8A857C]">{filme.year}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {filme.status === "assistido" && (
                <div className="flex items-center gap-1 text-[#D97757] font-medium text-sm">
                  <Star className="w-3.5 h-3.5 fill-[#D97757]" />
                  {filme.rating ?? "—"}/10
                </div>
              )}
              {filme.vote_average != null && (
                <div className="flex items-center gap-1 text-[#8A857C] text-sm">
                  <Globe className="w-3.5 h-3.5" />
                  {filme.vote_average.toFixed(1)}
                </div>
              )}
            </div>
            {filme.overview && (
              <p className="text-xs text-[#8A857C] mt-1.5 line-clamp-4">{filme.overview}</p>
            )}
          </div>
        </div>

        {filme.genres && filme.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {filme.genres.map((g) => (
              <span
                key={g}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2622] text-[#8A857C]"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {filme.status === "assistido" && (
          <div className="border-t border-[#2A2622] pt-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">Sua nota</p>
                {filme.vote_average != null && (
                  <span className="flex items-center gap-1 text-xs text-[#8A857C]">
                    <Globe className="w-3 h-3" />
                    Nota TMDb: {filme.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
              {notaSalva && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="w-3.5 h-3.5" />
                  Salvo
                </span>
              )}
            </div>
            <RatingInput value={notaInput} onChange={setNotaInput} disabled={salvandoNota !== null} />
            <button
              onClick={handleAvaliar}
              disabled={
                salvandoNota !== null ||
                !notaEhValida(notaInput) ||
                Number(notaInput) === filme.rating
              }
              className="w-full mt-2 bg-[#D97757] text-[#12100E] font-medium py-1.5 rounded-md text-sm hover:bg-[#e5896d] transition disabled:opacity-60"
            >
              {salvandoNota !== null ? "Salvando..." : "Salvar nota"}
            </button>
          </div>
        )}

        <div className="border-t border-[#2A2622] pt-3">
          <p className="text-sm font-medium mb-2">Onde assistir</p>
          {carregando ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
              <span className="text-xs text-[#8A857C]">Buscando...</span>
            </div>
          ) : semProviders ? (
            <p className="text-xs text-[#8A857C]">Não disponível no Brasil.</p>
          ) : (
            <>
              <GrupoProviders titulo="Streaming" lista={providers.flatrate} />
              <GrupoProviders titulo="Alugar" lista={providers.rent} />
              <GrupoProviders titulo="Comprar" lista={providers.buy} />
            </>
          )}
        </div>

        {filme.status === "assistido" && (
          <button
            onClick={() => onVerComentarios(filme)}
            className="w-full text-xs text-[#8A857C] hover:text-[#F1EEE6] py-2 mt-3 transition"
          >
            Ver comentários
          </button>
        )}

        {filme.status === "assistido" && (
          <button
            onClick={handleMoverParaQuero}
            disabled={movendo}
            className="w-full text-xs text-[#8A857C] hover:text-[#F1EEE6] py-2 transition disabled:opacity-60"
          >
            {movendo ? "Movendo..." : "Mover para Quero ver"}
          </button>
        )}
      </div>
    </div>
  );
}
