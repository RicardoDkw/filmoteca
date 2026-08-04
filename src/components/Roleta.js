"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const TICKS = 24;
const DELAY_MIN = 40;
const DELAY_MAX = 320;

export default function Roleta({ lista, visivel, onClose, onVerDetalhes }) {
  const [indiceExibido, setIndiceExibido] = useState(0);
  const [sorteando, setSorteando] = useState(lista.length > 1);
  const [resultado, setResultado] = useState(lista.length === 1 ? lista[0] : null);
  const timeoutRef = useRef(null);

  function sortear() {
    if (lista.length <= 1) return;
    clearTimeout(timeoutRef.current);
    setResultado(null);
    setSorteando(true);
    const vencedor = Math.floor(Math.random() * lista.length);
    let k = 0;
    function passo() {
      const offset = TICKS - 1 - k;
      const idx = ((vencedor - offset) % lista.length + lista.length) % lista.length;
      setIndiceExibido(idx);
      if (k === TICKS - 1) {
        setSorteando(false);
        setResultado(lista[vencedor]);
        return;
      }
      const progresso = k / (TICKS - 1);
      const delay = DELAY_MIN + (DELAY_MAX - DELAY_MIN) * Math.pow(progresso, 3);
      k++;
      timeoutRef.current = setTimeout(passo, delay);
    }
    passo();
  }

  useEffect(() => {
    if (lista.length <= 1) return;
    const inicio = setTimeout(sortear, 0);
    return () => {
      clearTimeout(inicio);
      clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemAtual = sorteando ? lista[indiceExibido] : resultado;

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-lg p-6 w-full max-w-sm border border-[#2A2622] transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🎲 Sorteio</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div
            className={`w-40 h-56 mb-4 rounded-lg overflow-hidden border-2 transition-colors ${
              sorteando ? "border-[#2A2622]" : "border-[#D97757]"
            }`}
          >
            {itemAtual && (
              <img
                src={itemAtual.poster}
                alt={itemAtual.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {sorteando ? (
            <p className="text-sm text-[#8A857C]">Sorteando...</p>
          ) : (
            <>
              <p className="font-bold text-lg leading-tight">{resultado.title}</p>
              <p className="text-xs text-[#8A857C] mt-0.5">{resultado.year}</p>
              {lista.length === 1 && (
                <p className="text-xs text-[#8A857C] mt-2">Só tem esse na sua lista!</p>
              )}
            </>
          )}
        </div>

        {!sorteando && (
          <div className="flex gap-2 mt-5">
            {lista.length > 1 && (
              <button
                onClick={sortear}
                className="flex-1 border border-[#2A2622] text-[#F1EEE6] font-medium py-2 rounded-md hover:border-[#D97757] transition"
              >
                Sortear de novo
              </button>
            )}
            <button
              onClick={() => onVerDetalhes(resultado)}
              className="flex-1 bg-[#D97757] text-[#12100E] font-medium py-2 rounded-md hover:bg-[#e5896d] transition"
            >
              Ver detalhes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
