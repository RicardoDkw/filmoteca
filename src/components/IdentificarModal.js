"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { redimensionarImagem } from "@/lib/imagem";

// remove sufixos comuns de temporada/parte (ex: "Final Season Part 2", "2nd Season",
// "Cour 2") que a IA às vezes inclui no título mas o TMDb geralmente não cataloga —
// aplica em loop porque alguns títulos empilham mais de um sufixo
const SUFIXOS_TEMPORADA = [
  /[\s:–-]+(the\s+)?final\s+season(\s+part\s*\d+)?\s*$/i,
  /[\s:–-]+\d+(st|nd|rd|th)\s+season(\s+part\s*\d+)?\s*$/i,
  /[\s:–-]+season\s*\d+(\s+part\s*\d+)?\s*$/i,
  /[\s:–-]+season(\s+part\s*\d+)?\s*$/i,
  /[\s:–-]+part\s*\d+\s*$/i,
  /[\s:–-]+cour\s*\d+\s*$/i,
];
// numeral romano solto no final (ex: "Youjo Senki II" -> "Youjo Senki")
const SUFIXO_ROMANO = /[\s:–-]+(X{1,3}|IX|IV|V?I{1,3})\s*$/;

function limparTituloParaBusca(titulo) {
  if (!titulo) return titulo;
  let limpo = titulo.trim();
  let alterado = true;
  while (alterado) {
    alterado = false;
    for (const padrao of SUFIXOS_TEMPORADA) {
      const semSufixo = limpo.replace(padrao, "").trim();
      if (semSufixo !== limpo && semSufixo.length > 0) {
        limpo = semSufixo;
        alterado = true;
      }
    }
  }
  const semRomano = limpo.replace(SUFIXO_ROMANO, "").trim();
  if (semRomano.length > 0) limpo = semRomano;
  return limpo || titulo;
}

function blobParaBase64(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => resolve(leitor.result.split(",")[1]);
    leitor.readAsDataURL(blob);
  });
}

const TEXTO_CONFIANCA = {
  alta: { rotulo: "Encontramos:", cor: "text-[#F1EEE6]" },
  media: { rotulo: "Achamos que pode ser:", cor: "text-[#D97757]" },
  baixa: { rotulo: "Não temos certeza, mas talvez seja:", cor: "text-[#D97757]" },
};

export default function IdentificarModal({ visivel, onClose, onIdentificado }) {
  const [preview, setPreview] = useState("");
  const [identificando, setIdentificando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  function limpar() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setErro("");
    setResultado(null);
  }

  function fechar() {
    if (identificando) return;
    limpar();
    onClose();
  }

  async function identificar(file) {
    setErro("");
    setResultado(null);
    setIdentificando(true);
    try {
      const blob = await redimensionarImagem(file, 800);
      const base64 = await blobParaBase64(blob);
      const res = await fetch("/api/identificar-com-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagemBase64: base64, mediaType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível identificar a cena.");
      setResultado(data);
    } catch (err) {
      console.error("Erro ao identificar cena:", err);
      setErro(err.message || "Não foi possível identificar a cena. Tente novamente.");
    }
    setIdentificando(false);
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setErro("");
    setResultado(null);
    setPreview(URL.createObjectURL(file));
    identificar(file);
  }

  function continuar() {
    if (!resultado?.titulo) return;
    const tituloBusca = limparTituloParaBusca(resultado.titulo);
    limpar();
    onClose();
    onIdentificado(tituloBusca);
  }

  const infoConfianca = resultado?.encontrado
    ? TEXTO_CONFIANCA[resultado.confianca] || TEXTO_CONFIANCA.baixa
    : null;

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 transition-opacity duration-[250ms] ${
        visivel ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-[#1B1815] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md border border-[#2A2622] max-h-[85vh] overflow-y-auto transition-all duration-[250ms] ease-out ${
          visivel
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Identificar Filme/Série/Anime</h2>
          <button onClick={fechar} disabled={identificando}>
            <X className="w-4 h-4 text-[#8A857C]" />
          </button>
        </div>

        {!preview ? (
          <>
            <p className="text-xs text-[#8A857C] mb-4">
              Tire uma foto ou envie uma imagem de uma cena de filme, série ou anime pra
              descobrir o nome.
            </p>
            <label className="flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-dashed border-[#2A2622] hover:border-[#D97757] transition cursor-pointer">
              <Camera className="w-8 h-8 text-[#8A857C]" />
              <span className="text-sm text-[#8A857C]">Tirar foto ou escolher imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleArquivo}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <div>
            <img
              src={preview}
              alt="Cena enviada"
              className="w-full aspect-square object-cover rounded-lg mb-4"
            />

            {identificando && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-[#2A2622] border-t-[#D97757] rounded-full animate-spin" />
                <span className="text-xs text-[#8A857C]">Identificando cena...</span>
              </div>
            )}

            {erro && (
              <div className="text-center py-2">
                <p className="text-xs text-red-400 mb-3">{erro}</p>
                <button
                  onClick={limpar}
                  className="w-full border border-[#2A2622] text-[#F1EEE6] font-medium py-2 rounded-lg hover:border-[#D97757] hover:scale-[1.02] transition"
                >
                  Tentar outra imagem
                </button>
              </div>
            )}

            {resultado && !resultado.encontrado && (
              <div className="text-center py-2">
                <p className="text-sm text-[#F1EEE6] mb-1">
                  Não conseguimos identificar essa cena.
                </p>
                <p className="text-xs text-[#8A857C] mb-4">
                  Tente uma imagem mais nítida, de preferência sem legendas ou bordas.
                </p>
                <button
                  onClick={limpar}
                  className="w-full border border-[#2A2622] text-[#F1EEE6] font-medium py-2 rounded-lg hover:border-[#D97757] hover:scale-[1.02] transition"
                >
                  Tentar outra imagem
                </button>
              </div>
            )}

            {resultado?.encontrado && (
              <div>
                <p className={`text-sm mb-1 ${infoConfianca.cor}`}>
                  {infoConfianca.rotulo}{" "}
                  <span className="font-medium text-[#D97757]">{resultado.titulo}</span>
                </p>
                <p className="text-[10px] text-[#8A857C] mb-4">
                  Identificado com IA · confiança{" "}
                  {resultado.confianca === "media" ? "média" : resultado.confianca}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={limpar}
                    className="flex-1 border border-[#2A2622] text-[#F1EEE6] font-medium py-2 rounded-lg hover:border-[#D97757] hover:scale-[1.02] transition"
                  >
                    Tentar outra
                  </button>
                  <button
                    onClick={continuar}
                    className="flex-1 bg-[#D97757] text-[#12100E] font-medium py-2 rounded-lg hover:bg-[#e5896d] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97757]/20 transition"
                  >
                    Buscar na Filmoteca
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
