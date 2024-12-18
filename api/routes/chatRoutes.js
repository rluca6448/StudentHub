import express from 'express'
import { setChat, getChats, readMessage, getMessages } from '../controllers/chatControllers.js';

const router = express.Router();

router.post("/chat", setChat);
//router.post("/readMessage", readMessagesWebhook);
//router.post("/listenMessages", listenMessagesWebhook);
router.post("/getChats", getChats);
router.post("/read", readMessage);
router.post("/getMessages", getMessages)

export default router;