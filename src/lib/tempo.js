const UNIDADES = [
  { limite: 60, divisor: 1, unidade: "second" },
  { limite: 3600, divisor: 60, unidade: "minute" },
  { limite: 86400, divisor: 3600, unidade: "hour" },
  { limite: 2592000, divisor: 86400, unidade: "day" },
  { limite: 31536000, divisor: 2592000, unidade: "month" },
  { limite: Infinity, divisor: 31536000, unidade: "year" },
];

const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatarTempoRelativo(dataISO) {
  const segundos = (Date.now() - new Date(dataISO).getTime()) / 1000;
  if (segundos < 5) return "agora";
  for (const { limite, divisor, unidade } of UNIDADES) {
    if (segundos < limite) {
      return rtf.format(-Math.round(segundos / divisor), unidade);
    }
  }
  return "";
}
