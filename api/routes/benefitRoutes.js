import express from 'express';
/*const { fetchCategories } = require('../controllers/benefitController');
const { fetchFeaturedImages } = require('../controllers/benefitController');
const { fetchBenefitsByCategory } = require('../controllers/benefitController');
const { fetchBenefits } = require('../controllers/SearchBars/BenefitSearch'); */
import { fetchCategories, fetchFeaturedImages, fetchBenefitsByCategory } from '../controllers/benefitController.js';
import { fetchBenefits } from '../controllers/SearchBars/BenefitSearch.js'

const router = express.Router();

// Definir las rutas
router.get('/:universityId/benefit', fetchBenefits);
router.get('/:universityId/categories', fetchCategories);
router.get('/:universityId/featured_images', fetchFeaturedImages);
router.get('/:universityId/:category', fetchBenefitsByCategory);

//module.exports = router;

export default router;