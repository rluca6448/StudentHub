import express from 'express'
import { check_admin, getUserInfo, getUserLodgments, check_user_id, getUserUniversities, getUsername } from '../controllers/userControllers.js';

const router = express.Router();

router.post('/admin', check_admin);
router.post('/username', getUsername);
router.post('/user_id', check_user_id);
router.post('/get_user_lodgments', getUserLodgments);
router.get('/get_user/:userId', getUserInfo);
router.get('/get_user_info/:userId', getUserInfo);
router.get('/get_user_universities', getUserUniversities);

export default router;