import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      register: async (name, email, password) => {
        try {
          set({ isLoading: true });
          const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          set({ user: data.user, token: data.token, isLoading: false });
          return true;

        } catch (err) {
          set({ isLoading: false });
          return false;
        }
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.message);

          set({ user: data.user, token: data.token, isLoading: false });
          return true;

        } catch (err) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;