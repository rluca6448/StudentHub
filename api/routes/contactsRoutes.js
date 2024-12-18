import express from 'express';
import { fetchAllUniversities, fetchContactsByUniversity, fetchMyUniversity } from '../controllers/contactsController.js'

const router = express.Router();

router.get('/:universityId/:activeUserId/contactsByUniversity', fetchContactsByUniversity);
router.get('/:universityId/allUniversities', fetchAllUniversities);
router.get('/:universityId/myUniversity', fetchMyUniversity);

export default router;



