import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  show: boolean;
  message: string;
  type: ToastType;
};

type UIState = {
  toast: ToastState;
  setToast: (show: boolean, message?: string, type?: ToastType) => void;
  showToast: (message: string, type?: ToastType) => void;
  // Modal state for future use (e.g. delete confirmation, profile)
  modalOpen: string | null;
  setModalOpen: (id: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  toast: { show: false, message: '', type: 'success' },
  setToast: (show, message = '', type = 'success') =>
    set({ toast: { show, message, type } }),
  showToast: (message, type = 'success') =>
    set({ toast: { show: true, message, type } }),
  modalOpen: null,
  setModalOpen: (id) => set({ modalOpen: id }),
}));
