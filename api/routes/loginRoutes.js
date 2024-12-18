import express from 'express'
import { checkUsername, checkEmail, registerUser, validateEmail, validateLogin, checkToken, resetPassword, changePassword, hashPassword, comparePasswords } from '../controllers/loginController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/validate_login', validateLogin);
router.post('/validate_ongoing_login', checkToken);
router.post('/reset_password', resetPassword)
router.post('/change_password', changePassword)
router.get('/check-username/:username', checkUsername);
router.get('/check-email/:fullMail', checkEmail);
router.get('/validate_email/:token', validateEmail);

router.post('/hash_password', hashPassword);
router.post('/compare_passwords', comparePasswords);

export default router;