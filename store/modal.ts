import { create } from "zustand";

interface ModalStore {
  modalRef: unknown;
  setModalRef: (ref: unknown) => void;
}

const useModalStore = create<ModalStore>((set) => ({
  modalRef: undefined,
  setModalRef: (ref) => set(() => ({ modalRef: ref })),
}));

export default useModalStore;
