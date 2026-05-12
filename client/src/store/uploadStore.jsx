import { create } from "zustand";
import useAuthStore from "./UserSlice";

const useUploadStore = create((set, get) => ({
  file: null,
  uploading: false,
  progress: 0,
  done: false,
  error: "",
  documentId: null,
  documents: [],
  documentsLoading: false,

  setFile: (file) => set({ file, error: "", done: false, progress: 0, documentId: null }),
  setError: (error) => set({ error }),
  reset: () => set({ file: null, uploading: false, progress: 0, done: false, error: "", documentId: null }),

  uploadFile: async () => {
    const { file } = get();
    const token = useAuthStore.getState().token;

    if (!token) return set({ error: "Please login first." });
    if (!file) return set({ error: "Please select a PDF first." });

    set({ uploading: true, progress: 0, done: false, error: "" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("[upload] Success, documentId:", data.documentId);
        set({ done: true, uploading: false, progress: 100, documentId: data.documentId });
      } else {
        console.error("[upload] Failed:", data.message);
        set({ error: data.message || "Upload failed.", uploading: false });
      }
    } catch (err) {
      console.error("[upload] Error:", err);
      set({ error: "Network error. Please try again.", uploading: false });
    }
  },

  fetchDocuments: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ documentsLoading: true });

    try {
      const response = await fetch("http://localhost:5000/api/documents/my-files", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("[documents] Fetched:", data.documents?.length);

      if (response.ok) {
        set({ documents: data.documents, documentsLoading: false });
      } else {
        console.error("[documents] Failed:", data.message);
        set({ documentsLoading: false });
      }
    } catch (err) {
      console.error("[documents] Error:", err);
      set({ documentsLoading: false });
    }
  },
}));

export default useUploadStore;