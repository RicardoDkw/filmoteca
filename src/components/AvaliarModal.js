"use client";

import { useState } from "react";
import { X } from "lucide-react";
import RatingInput, { notaEhValida } from "@/components/RatingInput";

export default function AvaliarModal({ filme, visivel, onClose, onAvaliar }) {
  const [nota, setNota] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  async function handleConfirmar() {
    if (confirmando || !notaEhValida(nota)) return;
    setConfirmando(true);
    const ok = await onAvaliar(filme.id, Number(nota));
    setConfirmando(false);
    if (ok) onClose();
  }

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm border border-[#2A2622] transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Já assisti</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={filme.poster}
            alt={filme.title}
            className="w-16 h-24 object-cover rounded-lg shrink-0"
          />
          <div>
            <p className="font-medium">{filme.title}</p>
            <p className="text-xs text-[#8A857C]">{filme.year}</p>
          </div>
        </div>

        <label className="text-xs text-[#8A857C] mb-1 block">Qual nota você dá?</label>
        <div className="mb-4">
          <RatingInput value={nota} onChange={setNota} disabled={confirmando} />
        </div>

        <button
          onClick={handleConfirmar}
          disabled={confirmando || !notaEhValida(nota)}
          className="w-full bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition disabled:opacity-60"
        >
          {confirmando ? "Salvando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
