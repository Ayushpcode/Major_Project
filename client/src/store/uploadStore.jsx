import { create } from "zustand";
import useAuthStore from "./UserSlice";

const useUploadStore = create((set, get) => ({
  file: null,
  uploading: false,
  progress: 0,
  done: false,
  error: "",
  documentId: null,

  setFile: (file) => set({ file, error: "", done: false, progress: 0, documentId: null }),
  reset: () => set({ file: null, uploading: false, progress: 0, done: false, error: "", documentId: null }),

uploadFile: async () => {
  const { file } = get();
  const token = useAuthStore.getState().token;

  if (!token) return set({ error: "Please login first." });
  if (!file)  return set({ error: "Please select a PDF first." });

  set({ uploading: true, progress: 0, done: false, error: "" });

  let fakeProgress = 0;
  const interval = setInterval(() => {
    fakeProgress += Math.random() * 12;
    if (fakeProgress >= 90) { fakeProgress = 90; clearInterval(interval); }
    set({ progress: Math.round(fakeProgress) });
  }, 300);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:5000/api/documents/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();

    clearInterval(interval);

    if (res.ok) {
      set({ progress: 100, done: true, uploading: false, documentId: data.documentId });
    } else {
      set({ error: data.message || "Upload failed.", uploading: false, progress: 0 });
    }
  } catch {
    clearInterval(interval);
    set({ error: "Network error. Please try again.", uploading: false, progress: 0 });
  }
},
}));

export default useUploadStore;