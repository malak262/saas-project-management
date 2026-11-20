import { create } from "zustand";
let saved = {};
try {
  saved = JSON.parse(sessionStorage.getItem("teamflow.session") || "{}");
} catch {
  /* Ignore invalid browser storage. */
}
if (
  typeof saved.token !== "string" ||
  !saved.user?.id ||
  typeof saved.user?.name !== "string" ||
  !saved.expiresAt ||
  !Number.isFinite(Date.parse(saved.expiresAt)) ||
  Date.parse(saved.expiresAt) <= Date.now()
)
  saved = {};
export const useSession = create((set) => ({
  token: saved.token || null,
  user: saved.user || null,
  expiresAt: saved.expiresAt || null,
  signIn: (data) => {
    sessionStorage.setItem("teamflow.session", JSON.stringify(data));
    set(data);
  },
  updateUser: (user) =>
    set((state) => {
      const next = { token: state.token, expiresAt: state.expiresAt, user };
      sessionStorage.setItem("teamflow.session", JSON.stringify(next));
      return { user };
    }),
  signOut: () => {
    sessionStorage.removeItem("teamflow.session");
    set({ token: null, user: null, expiresAt: null });
  },
}));
