import { create } from "zustand";

interface LoadingState {
  isLoading: boolean;
  label?: string;
  variant?: "cards" | "table" | "form";
  setLoading: (isLoading: boolean, options?: { label?: string; variant?: "cards" | "table" | "form" }) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  label: undefined,
  variant: "cards",
  setLoading: (isLoading, options) => set({ isLoading, ...options }),
}));
