import { Link } from 'react-router-dom';

export default function NotFoundPage(){
  return <div className="grid min-h-screen place-items-center bg-slate-100 p-6 text-center"><div><h1 className="text-4xl font-bold">404</h1><p className="mt-2 text-slate-500">Page not found</p><Link to="/" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-white">Go Home</Link></div></div>;
}
