import { createRequire } from "module";
import fs from "fs";
import { chunkText } from "../config/chunkText.js";
import Document from "../models/File.js";
import chromaClient from "../config/chroma.js";
import { embedText } from "../config/gemini.js";


const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

export const uploadPDF = async (req, res) => {
  const filePath = req.file?.path;

  try {
   
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData   = await pdfParse(dataBuffer);
    const text      = pdfData.text.trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "PDF appears empty or is image-based (scanned)",
      });
    }

    const chunks = chunkText(text);

    const newDoc = await Document.create({
      userId:      req.user.id,
      fileName:    req.file.originalname,
      totalChunks: chunks.length,
      chromaIds:   [],
    });

    const docId = newDoc._id.toString();

    console.log(`[uploadPDF] Embedding ${chunks.length} chunks for doc: ${docId}`);

    const embeddings = await Promise.all(
      chunks.map((chunk) => embedText(chunk))
    );

    const ids = chunks.map((_, i) => `${docId}_chunk_${i}`);

    const metadatas = chunks.map((_, i) => ({
      docId,
      fileName:   req.file.originalname,
      userId:     req.user.id.toString(),
      chunkIndex: i,
    }));

    const collection = await chromaClient.getCollection({ 
      name: "pdf_chunks",
      embeddingFunction: null,
      
     });

    await collection.add({
      ids,
      documents:  chunks,
      embeddings, 
      metadatas,
    });

    await Document.findByIdAndUpdate(docId, { chromaIds: ids });

    return res.status(200).json({
      success:     true,
      documentId:  newDoc._id,
      totalChunks: chunks.length,
    });

  } catch (error) {
    console.error("[uploadPDF] error:", error);
    return res.status(500).json({ success: false, message: error.message });

  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

export const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id })
      .select("fileName totalChunks createdAt _id")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, documents: docs });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find document and verify it belongs to the requesting user
    const doc = await Document.findOne({
      _id:    documentId,
      userId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Step 1: Remove all chunks from ChromaDB
    if (doc.chromaIds?.length > 0) {
      const collection = await chromaClient.getCollection({ 
        name: "pdf_chunks",
      embeddingFunction: null
     });
      await collection.delete({ ids: doc.chromaIds });
      console.log(`[deleteDocument] Removed ${doc.chromaIds.length} chunks from ChromaDB`);
    }

    // Step 2: Remove metadata from MongoDB
    await Document.findByIdAndDelete(documentId);

    res.status(200).json({ success: true, message: "Document deleted successfully" });

  } catch (error) {
    console.error("[deleteDocument] error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id })
      .select("fileName totalChunks createdAt _id");

    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });

    res.status(200).json({ success: true, fileName: doc.fileName, _id: doc._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};