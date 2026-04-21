function Modal({ title, children, onClose, onConfirm, confirmText = "Confirm", open }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-5 shadow-glow">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-3 text-sm text-muted-foreground">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
