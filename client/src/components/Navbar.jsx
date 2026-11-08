import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Navbar({ onAddClick, selectedDate, onDateChange }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">Sweety</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Glucose Tracker
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Diabetes Health Companion</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* User profile badge */}
          {user && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">
              <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium hidden sm:inline">{user.name}</span>
              {user.role === 'doctor' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Doctor
                </span>
              )}
            </div>
          )}

          {/* Quick Record Button */}
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-200"
            >
              + Record Reading
            </button>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
