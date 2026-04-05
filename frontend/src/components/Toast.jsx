/**
 * Toast Notification Component
 */

import React, { useEffect } from 'react';

export function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500/20 border-green-500/50',
    error: 'bg-red-500/20 border-red-500/50',
    warning: 'bg-amber-500/20 border-amber-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
  }[type];

  const textColor = {
    success: 'text-green-300',
    error: 'text-red-300',
    warning: 'text-amber-300',
    info: 'text-blue-300',
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[type];

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-full border backdrop-blur-md ${bgColor} flex items-center gap-3 animate-fade-in`}>
      <span className="text-xl">{icon}</span>
      <p className={`text-sm font-semibold ${textColor}`}>{message}</p>
      <button
        onClick={onClose}
        className={`ml-2 text-xl opacity-60 hover:opacity-100 transition-opacity ${textColor}`}
      >
        ✕
      </button>
    </div>
  );
}

export default Toast;
