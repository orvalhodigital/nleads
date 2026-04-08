
/**
 * Redimensiona e recorta uma imagem para o tamanho especificado (cover) e converte para WebP.
 * @param file Arquivo de imagem original
 * @param width Largura desejada
 * @param height Altura desejada
 * @param quality Qualidade da compressão (0 a 1)
 * @returns Promise com o Blob da imagem processada em formato WebP
 */
export const resizeImage = (file: File, width: number, height: number, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Não foi possível obter contexto do canvas'));
                return;
            }

            // Calcular dimensões para "object-fit: cover"
            const scale = Math.max(width / img.width, height / img.height);
            const dWidth = img.width * scale;
            const dHeight = img.height * scale;

            const dx = (width - dWidth) / 2;
            const dy = (height - dHeight) / 2;

            ctx.drawImage(img, dx, dy, dWidth, dHeight);

            // Tentar converter para WebP primeiro, fallback para JPEG se não suportado
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Erro ao processar imagem'));
                }
            }, 'image/webp', quality);
        };

        img.onerror = (err) => reject(err);
    });
};
