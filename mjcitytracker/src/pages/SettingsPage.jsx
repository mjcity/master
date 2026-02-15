import { useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { currentUser, changePassword, supabaseEnabled } = useAuth();

  const [status, setStatus] = useState('No permissions requested yet.');
  const [streamOn, setStreamOn] = useState(false);
  const videoRef = useRef(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwStatus, setPwStatus] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const requestCameraMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamOn(true);
      setStatus('Camera + microphone access granted.');
    } catch (err) {
      setStatus(`Permission error: ${err.message}`);
    }
  };

  const stopStream = () => {
    const src = videoRef.current?.srcObject;
    if (src) {
      src.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamOn(false);
    setStatus('Camera/mic stream stopped.');
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPwStatus('');

    if (!pwForm.newPassword || pwForm.newPassword.length < 8) {
      setPwStatus('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus('New password and confirmation do not match.');
      return;
    }

    try {
      setPwLoading(true);
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwStatus('Password updated successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwStatus(err.message || 'Could not update password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Layout title="Settings" subtitle="Profile, password, and device permissions" showAdd={false}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div id="account" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-lg font-bold">Profile & Password</h3>
          <p className="mt-1 text-sm text-slate-500">Manage your account from your profile menu and this page.</p>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-800">{currentUser?.name}</p>
            <p className="text-slate-600">{currentUser?.email}</p>
          </div>

          <form onSubmit={submitPasswordChange} className="mt-4 space-y-3">
            {!supabaseEnabled && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Current password</span>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((s) => ({ ...s, currentPassword: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">New password</span>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((s) => ({ ...s, newPassword: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</span>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pwLoading ? 'Updating...' : 'Change password'}
            </button>

            {pwStatus && <p className="text-sm text-slate-600">{pwStatus}</p>}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-lg font-bold">Phone Media Access</h3>
          <p className="mt-1 text-sm text-slate-500">Enable camera, microphone, album, and files for progress updates.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={requestCameraMic} className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Allow Camera + Mic</button>
            <button onClick={stopStream} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50">Stop</button>
          </div>
          <p className="mt-3 text-sm text-slate-600">{status}</p>
          <video ref={videoRef} autoPlay muted playsInline className="mt-4 w-full rounded-xl bg-slate-900" />
          {streamOn && <p className="mt-2 text-xs text-emerald-600">Live preview enabled</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft lg:col-span-2">
          <h3 className="text-lg font-bold">Upload from Album & Files</h3>
          <p className="mt-1 text-sm text-slate-500">These buttons open your phone gallery or file manager.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Album (Photos/Videos)</span>
              <input type="file" accept="image/*,video/*" multiple className="block w-full rounded-lg border border-slate-300 p-2" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Files (Documents/Any)</span>
              <input type="file" multiple className="block w-full rounded-lg border border-slate-300 p-2" />
            </label>
          </div>
        </div>
      </div>
    </Layout>
  );
}
