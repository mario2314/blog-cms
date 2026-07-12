export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="animate-dialog-in w-full max-w-sm rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-body text-xl font-semibold text-primary">{title}</h3>
        <p className="pt-2 font-body font-light text-primary">{message}</p>
        <div className="flex justify-end gap-2 pt-5">
          <button type="button" onClick={onCancel} className="rounded-lg border border-grey-light px-4 py-2 font-body text-sm font-semibold text-primary hover:bg-grey-lightest">Batal</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-red-700">Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}
