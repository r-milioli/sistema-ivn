const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

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

// Rotas públicas
router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.post('/forgot-password', forgotPasswordValidation, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword);

// Rota protegida
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
