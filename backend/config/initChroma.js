import chromaClient from "./chroma.js";

export const initChromaCollections = async () => {
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: "pdf_chunks",
      embeddingFunction: null, 
      metadata: {
        description:  "PDF text chunks with Gemini embeddings",
        "hnsw:space": "cosine",
      },
    });

    // console.log(
    //   `[ChromaDB] Collection "pdf_chunks" ready — ` +
    //   `${await collection.count()} chunks currently stored`
    // );

    return collection;

  } catch (error) {
    console.error("[ChromaDB] Failed to initialize collections:", error.message);
    throw error;
  }
};