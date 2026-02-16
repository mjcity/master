import { useEffect, useRef, useState } from 'react';
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
  const titleRef = useRef(null);

  useEffect(() => {
    setForm(initialGoal || defaultGoal);
  }, [initialGoal, open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
    return () => clearTimeout(t);
  }, [open]);

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/55 p-3 md:grid md:place-items-center md:p-4">
      <form onSubmit={submit} className="mx-auto mt-4 w-full max-w-lg rounded-[28px] border border-white/20 bg-gradient-to-br from-cyan-300 via-blue-300 to-indigo-300 p-5 text-slate-950 shadow-[0_18px_35px_rgba(2,6,23,0.45)] md:mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">{initialGoal ? 'Edit Goal' : 'Create Goal'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/60 p-1 text-slate-700 hover:bg-white"><FaXmark /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-800">Title</label>
            <input ref={titleRef} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-white/60 bg-white/75 px-3 py-2 font-medium text-slate-900" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-800">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-xl border border-white/60 bg-white/75 px-3 py-2 font-medium text-slate-900" rows="3" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-800">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-white/60 bg-white/75 px-3 py-2 font-medium text-slate-900">
                <option>Personal</option><option>Career</option><option>Health</option><option>Finance</option><option>Learning</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-800">Progress %</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))} className="w-full rounded-xl border border-white/60 bg-white/75 px-3 py-2 font-medium text-slate-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-800">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="h-11 w-full appearance-none rounded-xl border border-white/60 bg-white/75 px-3 py-2 font-medium text-slate-900" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/40 p-3">
            <p className="mb-2 text-sm font-bold text-slate-800">Goal Photo/Video</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="cursor-pointer rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm font-semibold hover:bg-white">
                Take Photo/Video
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleMedia(e.target.files?.[0])}
                />
              </label>

              <label className="cursor-pointer rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm font-semibold hover:bg-white">
                Upload Photo/Video
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleMedia(e.target.files?.[0])}
                />
              </label>
            </div>

            {loadingMedia && <p className="mt-2 text-xs text-slate-600">Processing media...</p>}

            {form.media?.dataUrl && (
              <div className="mt-3">
                {form.media.type?.startsWith('video/') ? (
                  <video src={form.media.dataUrl} controls className="max-h-44 w-full rounded-xl bg-black" />
                ) : (
                  <img src={form.media.dataUrl} alt="Goal media preview" className="max-h-44 w-full rounded-xl object-cover" />
                )}
                <button type="button" onClick={() => setForm((p) => ({ ...p, media: null }))} className="mt-2 text-xs font-semibold text-rose-700 hover:underline">Remove media</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{initialGoal ? 'Save Changes' : 'Create Goal'}</button>
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
