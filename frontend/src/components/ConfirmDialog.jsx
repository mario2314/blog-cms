export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="font-body text-lg font-semibold text-primary">{title}</h3>
        <p className="pt-2 font-body text-sm text-gray-600">{message}</p>
        <div className="pt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-grey-light px-4 py-2 font-body text-sm font-semibold text-primary hover:bg-grey-lightest"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
