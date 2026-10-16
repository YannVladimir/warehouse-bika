import React from 'react';
import { Outlet } from 'react-router-dom';
import logoBika from '../assets/logo-bika.png';

// Chrome-free wrapper for pages meant to be embedded in an <iframe> inside another system's own
// popup/modal -- no nav, no header, no footer, just a small brand mark so it's clear whose form
// this is, sized for a popup rather than a full browser window.
export const EmbedLayout = () => (
  <div className="min-h-full bg-white dark:bg-[#0b0f19] transition-colors duration-300">
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-center space-x-2 mb-6 opacity-70">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1">
          <img src={logoBika} alt="Bika Archive" className="h-full w-full object-contain" />
        </div>
        <span className="text-[11px] font-bold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
          Bika Archive
        </span>
      </div>
      <Outlet />
    </div>
  </div>
);
export default EmbedLayout;
