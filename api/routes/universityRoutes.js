import express from 'express'
import { fetchDomains, fetchUniversities, fetchCoordinates, addMail, getUniversityByDomain } from '../controllers/universityControllers.js';

const router = express.Router();

router.get('/domains', fetchDomains);
router.get('/coordinates/:universityId', fetchCoordinates);
router.post('/my_university', fetchUniversities);
router.post('/mail', addMail);
router.get('/get_university/:universityDomain', getUniversityByDomain);

export default router;