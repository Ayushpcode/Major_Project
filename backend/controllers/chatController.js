import Chat from "../models/Chat.js";
import Document from "../models/File.js";
import chromaClient from "../config/chroma.js";
import { embedText, analyzeWithGemini } from "../config/gemini.js";

export const sendMessage = async (req, res) => {
  try {
    const { documentId, message, chatId } = req.body;

    if (!documentId || !message) {
      return res.status(400).json({
        success: false,
        message: "documentId and message are required",
      });
    }

    const doc = await Document.findOne({
      _id: documentId,
      userId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
      if (!chat) {
        return res.status(404).json({ success: false, message: "Chat not found" });
      }
    } else {
      chat = await Chat.create({
        userId:     req.user.id,
        documentId: doc._id,
        fileName:   doc.fileName,
        messages:   [],
      });
    }

    // ── Step 1: Embed the user query ──────────────────────────────────────────
    const queryEmbedding = await embedText(message);

    // ── Step 2: Query ChromaDB for relevant chunks ────────────────────────────
    const collection = await chromaClient.getCollection({
      name: "pdf_chunks",
      embeddingFunction: null,
    });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults:        5,
      where:           { docId: doc._id.toString() },
    });

    const chunks    = results.documents[0]  || [];
    const metadatas = results.metadatas[0]  || [];
    const distances = results.distances[0]  || [];

    // ── Step 3: Build context string ──────────────────────────────────────────
    const context = chunks.length > 0
      ? chunks.map((chunk, i) => `[Chunk ${i + 1}]:\n${chunk}`).join("\n\n")
      : "No relevant context found in the document.";

    // ── Step 4: Build recent chat history ─────────────────────────────────────
    const recentHistory = chat.messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    // ── Step 5: Strict document-only prompt ───────────────────────────────────
  const prompt = `
You are a smart, friendly, and context-aware AI assistant helping users understand their uploaded document.

BEHAVIOR RULES:
1. If the question is answered by the retrieved context → answer from the document first, then you may add more detail from your general knowledge.

2. If the question is a genuine general knowledge question (like "What is React?", "Explain Node.js", "What is MongoDB?" etc.) → answer it helpfully using your own knowledge. You can also mention if it's related to the document.

3. If the question is completely irrelevant, nonsensical, or has nothing to do with the document topic OR general tech/knowledge → give a friendly refusal:
   - "Bro 😄 document mein iska kuch mila hi nahi."
   - "Ye topic is document ke bahar hai 😄"
   - "Jitna document mein hai utna hi bata sakta hu 😄"

4. NEVER make up information about the document that is not in the context.
5. Tone: friendly, helpful, slightly casual, human-like, never robotic.
6. Always prioritize document context over general knowledge.

--- RETRIEVED DOCUMENT CONTEXT ---
${context}

--- CHAT HISTORY ---
${recentHistory || "No previous messages."}

--- USER QUESTION ---
${message}
`.trim();

    // ── Step 6: Generate answer via Gemini ────────────────────────────────────
    const answer = await analyzeWithGemini(prompt);

    // ── Step 7: Build sources ─────────────────────────────────────────────────
    const sources = metadatas.map((meta, i) => ({
      chunkIndex: meta.chunkIndex,
      similarity: (1 - distances[i]).toFixed(4),
      preview:    chunks[i]?.slice(0, 150) + "...",
    }));

    // ── Step 8: Save messages to MongoDB ──────────────────────────────────────
    chat.messages.push({ role: "user",      content: message });
    chat.messages.push({ role: "assistant", content: answer, sources });
    await chat.save();

    return res.status(200).json({
      success: true,
      chatId:  chat._id,
      answer,
      sources,
    });

  } catch (error) {
    console.error("[sendMessage] error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    return res.status(200).json({
      success:    true,
      chatId:     chat._id,
      documentId: chat.documentId,
      fileName:   chat.fileName,
      messages:   chat.messages,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .select("documentId fileName createdAt updatedAt messages")
      .sort({ updatedAt: -1 });

    const summary = chats.map((chat) => ({
      chatId:       chat._id,
      documentId:   chat.documentId,
      fileName:     chat.fileName,
      messageCount: chat.messages.length,
      lastMessage:  chat.messages.at(-1)?.content?.slice(0, 100) || "",
      updatedAt:    chat.updatedAt,
    }));

    return res.status(200).json({ success: true, chats: summary });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOneAndDelete({
      _id:    chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    return res.status(200).json({ success: true, message: "Chat deleted successfully" });

  } catch (error) {
    console.error("[deleteChat] error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};