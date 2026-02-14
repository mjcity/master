import { useRef, useState } from 'react';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const [status, setStatus] = useState('No permissions requested yet.');
  const [streamOn, setStreamOn] = useState(false);
  const videoRef = useRef(null);

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

  return (
    <Layout title="Settings" subtitle="Device permissions and media access" showAdd={false}>
      <div className="grid gap-4 lg:grid-cols-2">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-lg font-bold">Upload from Album & Files</h3>
          <p className="mt-1 text-sm text-slate-500">These buttons open your phone gallery or file manager.</p>
          <div className="mt-4 space-y-4">
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
