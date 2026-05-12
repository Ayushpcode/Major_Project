import { create } from "zustand";
import useAuthStore from "./UserSlice";

const useChatStore = create((set, get) => ({
  messages: [],
  isTyping: false,
  isLoading: false,
  docName: "",
  error: "",

  fetchDocument: async (id) => {
    const token = useAuthStore.getState().token;
    if (!id || !token) return;

    set({ isLoading: true, error: "" });

    try {
      const res = await fetch(`http://localhost:5000/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        set({ docName: data.name, isLoading: false });
      } else {
        set({ error: "Failed to load document.", isLoading: false });
      }
    } catch {
      set({ error: "Failed to load document.", isLoading: false });
    }
  },

  sendMessage: async (id, text) => {
    const token = useAuthStore.getState().token;
    if (!text || !id || !token) return;

    const now = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = { id: Date.now(), role: "user", text, time: now() };
    set((state) => ({ messages: [...state.messages, userMsg], isTyping: true }));

    try {
      const res = await fetch(`http://localhost:5000/api/chat/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: res.ok ? data.reply : "Something went wrong. Please try again.",
        time: now(),
      };
      set((state) => ({ messages: [...state.messages, aiMsg] }));
    } catch {
      const errMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: "Network error. Please try again.",
        time: now(),
      };
      set((state) => ({ messages: [...state.messages, errMsg] }));
    } finally {
      set({ isTyping: false });
    }
  },

  clearChat: () => set({ messages: [], docName: "", error: "" }),
}));

export default useChatStore;