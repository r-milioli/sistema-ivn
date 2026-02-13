/**
 * Compressão de imagem no cliente antes do upload.
 * Usa Canvas API nativa - sem dependências externas.
 * Reduz tamanho e dimensões sem perda visível de qualidade para avatares/fotos de perfil.
 *
 * @param {File} file - Arquivo de imagem (JPEG, PNG, GIF, WebP)
 * @param {Object} options - Opções de compressão
 * @param {number} options.maxWidth - Largura máxima (default: 1024)
 * @param {number} options.maxHeight - Altura máxima (default: 1024)
 * @param {number} options.quality - Qualidade JPEG 0-1 (default: 0.88)
 * @returns {Promise<File>} - Novo File comprimido em JPEG
 */
export async function compressImageForUpload(file, options = {}) {
  const maxWidth = options.maxWidth ?? 1024;
  const maxHeight = options.maxHeight ?? 1024;
  const quality = options.quality ?? 0.88;

  // Se não for imagem, retornar o arquivo original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Redimensionar mantendo proporção
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha na compressão da imagem'));
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar imagem para compressão'));
    };

    img.src = url;
  });
}
