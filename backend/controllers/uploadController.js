import { createRequire } from "module";
import fs from "fs";
import { chunkText } from "../config/chunkText.js";
import Document from "../models/File.js";
import chromaClient from "../config/chroma.js";
import { embedText } from "../config/gemini.js";

// ─── kept exactly as you had it ───────────────────────────────────────────────
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

// ─────────────────────────────────────────────────────────────────────────────
//  uploadPDF
//  OLD: parsed PDF → chunked → saved text + chunks to MongoDB
//  NEW: parsed PDF → chunked → embedded → stored in ChromaDB
//       MongoDB now stores only metadata (no text, no chunks)
// ─────────────────────────────────────────────────────────────────────────────
export const uploadPDF = async (req, res) => {
  const filePath = req.file?.path;

  try {
    // ── VALIDATION (unchanged from your original) ────────────────────────────
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ── STEP 1: Parse PDF (unchanged from your original) ─────────────────────
    // pdf-parse reads the binary buffer and extracts all readable text.
    // If the PDF is scanned / image-based, text will be empty → 422 error.
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData   = await pdfParse(dataBuffer);
    const text      = pdfData.text.trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "PDF appears empty or is image-based (scanned)",
      });
    }

    // ── STEP 2: Chunk the text (unchanged from your original) ─────────────────
    // chunkText splits the big text into smaller overlapping pieces
    // so no single chunk overwhelms the embedding model or the LLM.
    const chunks = chunkText(text);

    // ── STEP 3: Save metadata to MongoDB FIRST ───────────────────────────────
    // We save early so we get a MongoDB _id to use as a shared key.
    // That docId goes into every ChromaDB chunk's metadata,
    // linking both databases together.
    //
    // WHAT CHANGED vs your original:
    //   REMOVED → text:   text       (no more storing full PDF text)
    //   REMOVED → chunks: chunks     (no more storing chunks in Mongo)
    //   ADDED   → totalChunks        (just the count, for display)
    //   ADDED   → chromaIds: []      (filled after ChromaDB insert)
    const newDoc = await Document.create({
      userId:      req.user.id,
      fileName:    req.file.originalname,
      totalChunks: chunks.length,
      chromaIds:   [],
    });

    const docId = newDoc._id.toString();

    // ── STEP 4: Embed every chunk using Gemini ────────────────────────────────
    // embedText() calls Gemini text-embedding-004 and returns 768 numbers.
    // We embed ALL chunks in parallel with Promise.all for speed.
    // The same model MUST be used at query time — mismatched models
    // produce meaningless similarity scores.
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

    const collection = await chromaClient.getCollection({ name: "pdf_chunks" });

    await collection.add({
      ids,
      documents:  chunks,
      embeddings, 
      metadatas,
    });

    await Document.findByIdAndUpdate(docId, { chromaIds: ids });

    // ── STEP 8: Return success (same response shape as your original) ─────────
    return res.status(200).json({
      success:     true,
      documentId:  newDoc._id,
      totalChunks: chunks.length,
    });

  } catch (error) {
    console.error("[uploadPDF] error:", error);
    return res.status(500).json({ success: false, message: error.message });

  } finally {
    // ── CLEANUP (unchanged from your original) ───────────────────────────────
    // Always delete the temp file whether the upload succeeded or failed.
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

// ─────────────────────────────────────────────────────────────────────────────
//  deleteDocument  (NEW — did not exist in your original)
//
//  Why this is needed:
//  If you only delete from MongoDB, the chunks stay in ChromaDB forever.
//  They waste storage AND pollute future search results with ghost data.
//  Always delete ChromaDB first, then MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
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
      const collection = await chromaClient.getCollection({ name: "pdf_chunks" });
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