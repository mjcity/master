import { useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { currentUser, updateProfile, changePassword, supabaseEnabled } = useAuth();

  const [status, setStatus] = useState('No permissions requested yet.');
  const [streamOn, setStreamOn] = useState(false);
  const videoRef = useRef(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwStatus, setPwStatus] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    sex: currentUser?.sex || '',
    age: currentUser?.age || '',
    avatarUrl: currentUser?.avatarUrl || '',
    avatarPosX: Number(currentUser?.avatarPosX ?? 50),
    avatarPosY: Number(currentUser?.avatarPosY ?? 50)
  });
  const [profileMsg, setProfileMsg] = useState('');

  const requestCameraMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
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
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) return setPwStatus('New password must be at least 8 characters.');
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwStatus('New password and confirmation do not match.');
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

  const onPickAvatar = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    try {
      await updateProfile(profile);
      setProfileMsg('Profile saved.');
    } catch (err) {
      setProfileMsg(err.message || 'Profile update failed.');
    }
  };

  return (
    <Layout title="Settings" subtitle="Profile, password, and device permissions" showAdd={false}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div id="account" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-soft">
          <h3 className="text-lg font-bold">Personal Details</h3>

          <div className="mt-4 flex flex-col items-center">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-slate-300 bg-slate-100">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" style={{ objectPosition: `${profile.avatarPosX}% ${profile.avatarPosY}%` }} /> : null}
            </div>
            <label className="mt-3 cursor-pointer text-sm font-bold text-brand-600">Edit Photo<input type="file" accept="image/*" className="hidden" onChange={(e) => onPickAvatar(e.target.files?.[0])} /></label>
          </div>

          <div className="mt-4 space-y-3">
            <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 [-webkit-text-fill-color:#0f172a]" />
            <input value={profile.sex} onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value }))} placeholder="Sex" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 [-webkit-text-fill-color:#0f172a]" />
            <input value={profile.age} onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))} placeholder="Age" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 [-webkit-text-fill-color:#0f172a]" />
            <div>
              <p className="text-xs font-semibold text-slate-600">Center photo horizontally</p>
              <input type="range" min="0" max="100" value={profile.avatarPosX} onChange={(e) => setProfile((p) => ({ ...p, avatarPosX: Number(e.target.value) }))} className="w-full" />
              <p className="text-xs font-semibold text-slate-600">Center photo vertically</p>
              <input type="range" min="0" max="100" value={profile.avatarPosY} onChange={(e) => setProfile((p) => ({ ...p, avatarPosY: Number(e.target.value) }))} className="w-full" />
            </div>
            <button onClick={saveProfile} className="rounded-lg bg-brand-600 px-4 py-2 text-white">Save Profile</button>
            {profileMsg && <p className="text-sm text-slate-600">{profileMsg}</p>}
          </div>

          <form onSubmit={submitPasswordChange} className="mt-6 space-y-3 border-t border-slate-200 pt-4">
            <h4 className="font-bold">Change Password</h4>
            {!supabaseEnabled && <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((s) => ({ ...s, currentPassword: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 [-webkit-text-fill-color:#0f172a]" placeholder="Current password" required />}
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((s) => ({ ...s, newPassword: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 [-webkit-text-fill-color:#0f172a]" placeholder="New password" required />
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((s) => ({ ...s, confirmPassword: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 [-webkit-text-fill-color:#0f172a]" placeholder="Confirm new password" required />
            <button type="submit" disabled={pwLoading} className="rounded-lg bg-slate-900 px-4 py-2 text-white">{pwLoading ? 'Updating...' : 'Change password'}</button>
            {pwStatus && <p className="text-sm text-slate-600">{pwStatus}</p>}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-soft">
          <h3 className="text-lg font-bold">Phone Media Access</h3>
          <p className="mt-1 text-sm text-slate-500">Enable camera, microphone, album, and files for progress updates.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={requestCameraMic} className="rounded-lg bg-brand-600 px-4 py-2 text-white">Allow Camera + Mic</button>
            <button onClick={stopStream} className="rounded-lg border border-slate-300 px-4 py-2">Stop</button>
          </div>
          <p className="mt-3 text-sm text-slate-600">{status}</p>
          <video ref={videoRef} autoPlay muted playsInline className="mt-4 w-full rounded-xl bg-slate-900" />
          {streamOn && <p className="mt-2 text-xs text-emerald-600">Live preview enabled</p>}
        </div>
      </div>
    </Layout>
  );
}
