"use client";

import { useState } from "react";
import { Search, Star, Sparkles } from "lucide-react";

const PASSOS = [
  {
    Icon: Search,
    titulo: "Busque filmes e séries",
    texto: "Encontre qualquer título com a busca integrada à TMDb.",
  },
  {
    Icon: Star,
    titulo: "Avalie de 1 a 10",
    texto: "Dê sua nota para o que você já assistiu.",
  },
  {
    Icon: Sparkles,
    titulo: "Descubra recomendações",
    texto: "Receba sugestões personalizadas com base nas suas notas.",
  },
];

export default function Onboarding({ onFinalizar }) {
  const [passo, setPasso] = useState(0);
  const ultimo = passo === PASSOS.length - 1;
  const { Icon, titulo, texto } = PASSOS[passo];

  return (
    <div className="fixed inset-0 z-[70] bg-[#12100E] text-[#F1EEE6] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <button
            onClick={onFinalizar}
            className="text-xs text-[#8A857C] hover:text-[#F1EEE6] transition"
          >
            Pular
          </button>
        </div>

        <div
          key={passo}
          className="bg-[#1B1815] rounded-lg border border-[#2A2622] p-8 flex flex-col items-center text-center animate-[fade-slide-in_0.25s_ease-out]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#12100E] border border-[#2A2622] flex items-center justify-center mb-5">
            <Icon className="w-8 h-8 text-[#D97757]" />
          </div>
          <h2 className="text-lg font-bold mb-1.5">{titulo}</h2>
          <p className="text-sm text-[#8A857C]">{texto}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5 mb-5">
          {PASSOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === passo ? "w-4 bg-[#D97757]" : "w-1.5 bg-[#2A2622]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (ultimo ? onFinalizar() : setPasso(passo + 1))}
          className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition"
        >
          {ultimo ? "Começar" : "Próximo"}
        </button>
      </div>
    </div>
  );
}
