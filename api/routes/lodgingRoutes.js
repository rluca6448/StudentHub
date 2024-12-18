import express from 'express'
import { deleteLodge, fetchNearbyLodgings, getLodgeById, storeLodge } from '../controllers/lodgingController.js';

const router = express.Router();

router.get("/lodging_post/:lat/:lon/:radius", fetchNearbyLodgings);
router.get("/get_lodge/:postId", getLodgeById);
router.post("/store_lodge", storeLodge);
router.get("/delete_lodge/:postId", deleteLodge);

export default router;