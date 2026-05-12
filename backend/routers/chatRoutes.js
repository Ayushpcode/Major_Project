import express from "express";
import {
  sendMessage,
  getChatHistory,
  getAllChats,
  deleteChat,
} from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post("/",                  sendMessage);      // POST   /api/chat
router.get("/all",                  getAllChats);       // GET    /api/chats
router.get("/:chatId",           getChatHistory);   // GET    /api/chat/:chatId
router.delete("/:chatId",        deleteChat);       // DELETE /api/chat/:chatId

export default router;