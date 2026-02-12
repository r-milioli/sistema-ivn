/**
 * Rota para servir arquivos do storage (S3 ou local).
 * GET /api/storage/file/:key → stream do arquivo
 * O key pode conter barras (ex: comprovantes/abc.pdf ou fotos-perfil/pessoa-1.jpg)
 */
const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');

// key = tudo após /file/ (pode conter barras, ex: comprovantes/abc.pdf)
router.get(/^\/file\/(.+)$/, async (req, res) => {
  const key = (req.params[0] || req.path.replace(/^\/file\//, '')).trim();
  if (!key) {
    return res.status(400).json({ message: 'Key não informada' });
  }
  const pathOrKey = `${storageService.STORAGE_PREFIX}${decodeURIComponent(key)}`;
  const result = await storageService.getReadStream(pathOrKey);
  if (!result) {
    return res.status(404).json({ message: 'Arquivo não encontrado' });
  }
  res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
  result.stream.pipe(res);
});

module.exports = router;
