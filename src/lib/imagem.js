// redimensiona uma imagem no browser (canvas) antes do upload, mantendo a proporção
// e limitando o maior lado a maxLado, comprimindo como JPEG
export function redimensionarImagem(file, maxLado = 400) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível processar a imagem."));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, largura, altura);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Não foi possível gerar a imagem."));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  });
}
