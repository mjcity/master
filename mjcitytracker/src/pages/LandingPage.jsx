import { Link } from 'react-router-dom';
import { FaBullseye, FaChartLine, FaCamera, FaMicrophone, FaFolderOpen } from 'react-icons/fa6';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-xl"><FaBullseye /></div>
          <div>
            <p className="text-sm text-slate-300">Welcome to</p>
            <h1 className="text-3xl font-black tracking-tight">Mjcitytrack</h1>
          </div>
        </div>

        <p className="max-w-3xl text-lg text-slate-200">
          Mjcitytrack helps you set goals, track progress, hit deadlines, and stay locked in.
          You can also use your device camera, microphone, album, and files to attach real proof of progress.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-xl bg-brand-500 px-5 py-3 font-semibold hover:bg-brand-600">Get Started</Link>
          <Link to="/login" className="rounded-xl border border-slate-500 px-5 py-3 font-semibold hover:bg-slate-800">Login</Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature icon={<FaBullseye />} title="Goal Planning" text="Create personal, career, fitness, or money goals in seconds." />
          <Feature icon={<FaChartLine />} title="Progress Tracking" text="See completion rates, active goals, and momentum at a glance." />
          <Feature icon={<FaCamera />} title="Camera + Mic" text="Capture visual and voice updates directly from your phone." />
          <Feature icon={<FaFolderOpen />} title="Album + Files" text="Upload photos, videos, and documents to support your progress." />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-3 text-brand-400">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{text}</p>
    </div>
  );
}
