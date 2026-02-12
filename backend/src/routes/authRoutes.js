const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const { loginLimiter, forgotPasswordLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');

// Validações
const registerValidation = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email inválido'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token é obrigatório'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
];

// Rotas públicas (com rate limiting)
router.post('/register', registerLimiter, registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword);

// Rotas protegidas
router.get('/me', authMiddleware, authController.getMe);
router.put('/me/password', authMiddleware, [
  body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
  body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres'),
], handleValidationErrors, authController.updatePassword);
router.put('/me/email', authMiddleware, [
  body('email').isEmail().withMessage('Email inválido'),
], handleValidationErrors, authController.updateEmail);

module.exports = router;
