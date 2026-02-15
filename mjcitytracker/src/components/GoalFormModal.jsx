import { useEffect, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';

const defaultGoal = {
  title: '',
  description: '',
  category: 'Personal',
  progress: 0,
  dueDate: '',
  completed: false,
  media: null
};

export default function GoalFormModal({ open, onClose, onSubmit, initialGoal, userId }) {
  const [form, setForm] = useState(defaultGoal);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    setForm(initialGoal || defaultGoal);
  }, [initialGoal, open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      progress: Number(form.progress),
      userId
    });
  };

  const handleMedia = async (file) => {
    if (!file) return;
    setLoadingMedia(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      setForm((p) => ({
        ...p,
        media: {
          name: file.name,
          type: file.type,
          dataUrl
        }
      }));
    } finally {
      setLoadingMedia(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initialGoal ? 'Edit Goal' : 'Create Goal'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><FaXmark /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2" required />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2" rows="3" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2">
                <option>Personal</option><option>Career</option><option>Health</option><option>Finance</option><option>Learning</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Progress %</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Goal Photo/Video</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                Take Photo/Video
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleMedia(e.target.files?.[0])}
                />
              </label>

              <label className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                Upload Photo/Video
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleMedia(e.target.files?.[0])}
                />
              </label>
            </div>

            {loadingMedia && <p className="mt-2 text-xs text-slate-500">Processing media...</p>}

            {form.media?.dataUrl && (
              <div className="mt-3">
                {form.media.type?.startsWith('video/') ? (
                  <video src={form.media.dataUrl} controls className="max-h-44 w-full rounded-lg bg-black" />
                ) : (
                  <img src={form.media.dataUrl} alt="Goal media preview" className="max-h-44 w-full rounded-lg object-cover" />
                )}
                <button type="button" onClick={() => setForm((p) => ({ ...p, media: null }))} className="mt-2 text-xs text-rose-600 hover:underline">Remove media</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{initialGoal ? 'Save Changes' : 'Create Goal'}</button>
        </div>
      </form>
    </div>
  );
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
