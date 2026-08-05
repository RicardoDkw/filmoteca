"use client";

import { Star } from "lucide-react";

export function notaEhValida(valor) {
  if (valor === "" || valor === null || valor === undefined) return false;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 10;
}

export default function RatingInput({ value, onChange, disabled }) {
  const numero = Number(value);
  const valido = notaEhValida(value);
  const mostrarErro = value !== "" && value !== null && value !== undefined && !valido;

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(String(n))}
            aria-label={`Nota ${n}`}
            className="p-0.5 disabled:opacity-60"
          >
            <Star
              className={`w-5 h-5 transition ${
                valido && n <= numero
                  ? "fill-[#D97757] text-[#D97757]"
                  : "fill-none text-[#4A453D]"
              }`}
            />
          </button>
        ))}
      </div>
      <input
        type="number"
        min="1"
        max="10"
        step="1"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nota de 1 a 10"
        className={`w-full bg-[#12100E] border rounded-md px-3 py-2 text-sm focus:outline-none transition disabled:opacity-60 ${
          mostrarErro
            ? "border-red-500 focus:border-red-500"
            : "border-[#2A2622] focus:border-[#D97757]"
        }`}
      />
      {mostrarErro && (
        <p className="text-xs text-red-500 mt-1">
          Nota deve ser um número inteiro entre 1 e 10.
        </p>
      )}
    </div>
  );
}
