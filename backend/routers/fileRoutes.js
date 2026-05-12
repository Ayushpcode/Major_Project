
import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadPDF , getDocuments, deleteDocument }  from "../controllers/uploadController.js";
import authMiddleware  from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload",authMiddleware, upload.single("file"), uploadPDF);
router.get("/files", authMiddleware, getDocuments)
router.delete("/files/:documentId", authMiddleware, deleteDocument);

export default router;