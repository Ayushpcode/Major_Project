import { create } from "zustand";
import useAuthStore from "./UserSlice";

const BASE = "http://localhost:5000/api";
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
const jsonHeader = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});
const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const useChatStore = create((set, get) => ({
  // ── Documents ─────────────────────────────────────────────
  documents: [],
  documentsLoading: false,

  // ── Chat ──────────────────────────────────────────────────
  messages: [],
  isTyping: false,
  isLoading: false,
  docName: "",
  error: "",
  chatId: null,

  // ─────────────────────────────────────────────────────────
  fetchDocuments: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ documentsLoading: true });
    try {
      const res = await fetch(`${BASE}/documents/files`, {
        headers: authHeader(token),
      });
      const data = await res.json();
      set({ documents: res.ok ? data.documents : [], documentsLoading: false });
    } catch {
      set({ documentsLoading: false });
    }
  },

  // ─────────────────────────────────────────────────────────
  fetchDocument: async (id) => {
    const token = useAuthStore.getState().token;
    if (!id || !token) return;

    set({ isLoading: true, error: "" });
    try {
      // 1. Load doc name
      const docRes = await fetch(`${BASE}/documents/${id}`, {
        headers: authHeader(token),
      });
      const docData = await docRes.json();
      if (!docRes.ok) return set({ error: "Failed to load document.", isLoading: false });
      set({ docName: docData.fileName });

      // 2. Find existing chat for this document
      const allRes = await fetch(`${BASE}/chat/all`, { headers: authHeader(token) });
      const allData = await allRes.json();

      if (allRes.ok && allData.chats?.length) {
        const existing = allData.chats.find((c) => c.documentId?.toString() === id);

        if (existing) {
          // 3. Load full message history
          const histRes = await fetch(`${BASE}/chat/${existing.chatId}`, {
            headers: authHeader(token),
          });
          const histData = await histRes.json();

          if (histRes.ok) {
            const mapped = histData.messages.map((m, i) => ({
              id: i,
              role: m.role === "assistant" ? "ai" : "user",
              text: m.content,
              time: now(),
            }));
            return set({ chatId: existing.chatId, messages: mapped, isLoading: false });
          }
        }
      }

      // No existing chat → start fresh
      set({ isLoading: false });
    } catch {
      set({ error: "Failed to load document.", isLoading: false });
    }
  },

  deleteDocument: async (id) => {
    const token = useAuthStore.getState().token;
    if (!id || !token) return;

    try {
      const res = await fetch(`${BASE}/documents/files/${id}`, {
        method: "DELETE",
        headers: authHeader(token),
      });

      if (res.ok) {
        // Remove from local state instantly — no refetch needed
        set((s) => ({
          documents: s.documents.filter((d) => d._id !== id),
        }));
      }
    } catch {
      // silently fail — you can add a toast here later
    }
  },

  // ─────────────────────────────────────────────────────────
  sendMessage: async (id, text) => {
    const token = useAuthStore.getState().token;
    if (!text || !id || !token) return;

    set((s) => ({ messages: [...s.messages, { id: Date.now(), role: "user", text, time: now() }], isTyping: true }));

    try {
      const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: jsonHeader(token),
        body: JSON.stringify({ documentId: id, message: text, chatId: get().chatId ?? undefined }),
      });
      const data = await res.json();

      if (data.chatId) set({ chatId: data.chatId });

      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: Date.now() + 1,
            role: "ai",
            text: res.ok ? data.answer : "Something went wrong. Please try again.",
            time: now(),
          },
        ],
      }));
    } catch {
      set((s) => ({
        messages: [
          ...s.messages,
          { id: Date.now() + 1, role: "ai", text: "Network error. Please try again.", time: now() },
        ],
      }));
    } finally {
      set({ isTyping: false });
    }
  },



  // ─────────────────────────────────────────────────────────
  clearChat: () => set({ messages: [], docName: "", error: "", chatId: null }),
}));

export default useChatStore;