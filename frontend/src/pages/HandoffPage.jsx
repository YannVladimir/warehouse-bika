import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/api';
import { AlertCircle } from 'lucide-react';
import logoBika from '../assets/logo-bika.png';

// Landing point for the "File in Archive" link from the bika DMS: exchanges the one-time
// handoff token for a real session, then drops the user straight into the add-document form.
// targetPath lets the embed variant (rendered inside an <iframe> in the DMS's own popup) land on
// /embed/add instead of the full standalone /add page.
export const HandoffPage = ({ targetPath = '/add', compact = false }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { loginWithHandoff } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setError('This link is missing its handoff token.');
      return;
    }

    loginWithHandoff(token)
      .then((data) => {
        const params = new URLSearchParams();
        if (data.documentRef) params.set('ref', data.documentRef);
        if (data.documentTitle) params.set('title', data.documentTitle);
        if (data.custodian) params.set('custodian', data.custodian);
        const query = params.toString();
        navigate(`${targetPath}${query ? `?${query}` : ''}`, { replace: true });
      })
      .catch((err) => {
        setError(extractErrorMessage(err, 'This link is invalid or has expired.'));
      });
  }, [token, loginWithHandoff, navigate, targetPath]);

  const body = (
    <>
      {error ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 flex items-start space-x-3 text-xs font-semibold text-left">
            <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          {!compact && (
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            >
              Go to sign in
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Signing you in...
          </p>
        </div>
      )}
    </>
  );

  if (compact) {
    return <div className="text-center py-6">{body}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19] px-4 py-12 transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-fade-in text-center">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 p-2.5 mb-4">
            <img src={logoBika} alt="Bika Logo" className="h-full w-full object-contain" />
          </div>
        </div>
        {body}
      </div>
    </div>
  );
};
export default HandoffPage;
