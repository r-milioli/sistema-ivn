const { validationResult } = require('express-validator');

/**
 * Middleware para processar erros de validação
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  
  next();
};

module.exports = handleValidationErrors;
