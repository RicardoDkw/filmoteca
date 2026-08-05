"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function ToastConquistas({ badges, onFechar }) {
  useEffect(() => {
    const timer = setTimeout(onFechar, 4000);
    return () => clearTimeout(timer);
  }, [onFechar]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm animate-[fade-slide-in_0.3s_ease-out]">
      <div className="bg-[#1B1815] border border-[#D97757] rounded-lg p-4 shadow-lg flex items-start gap-3">
        <span className="text-2xl shrink-0">🏆</span>
        <div className="flex-1">
          <p className="text-sm font-bold mb-1">Nova conquista desbloqueada!</p>
          {badges.map((b) => (
            <p key={b.id} className="text-xs text-[#8A857C]">
              {b.emoji} {b.nome}
            </p>
          ))}
        </div>
        <button onClick={onFechar} aria-label="Fechar">
          <X className="w-3.5 h-3.5 text-[#8A857C]" />
        </button>
      </div>
    </div>
  );
}
