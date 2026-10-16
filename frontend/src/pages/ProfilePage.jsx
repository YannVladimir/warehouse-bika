import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../services/api';
import { User, Key, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/10 transition-all";

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const ROLE_LABELS = { SUPER_ADMIN: 'Super Admin', COMPANY_ADMIN: 'Company Admin', USER: 'User' };

export const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName,
    email: user.email
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    if (!profileForm.fullName.trim() || !profileForm.email.trim()) {
      return setProfileMsg({ type: 'error', text: 'Name and email are required.' });
    }
    setSavingProfile(true);
    try {
      await updateProfile(profileForm.fullName, profileForm.email);
      setProfileMsg({ type: 'success', text: 'Profile information updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: extractErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
    }
    if (passwordForm.newPassword.length < 8) {
      return setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
    }
    setSavingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: extractErrorMessage(err, 'Could not change password.') });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-650 text-white shadow-md shadow-blue-500/25">
            <User className="h-5 w-5" />
          </div>
          My Profile Settings
        </h1>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          Manage your personal account credentials, change password, and system details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Avatar Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
            <div className="h-20 w-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center font-extrabold text-blue-600 dark:text-blue-400 text-2xl mb-4 shadow-inner">
              {user.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
              {user.fullName}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              {user.email}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full text-2xs font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
        </div>

        {/* Right Side: Account Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-blue-500" />
              Personal Info
            </h4>

            {profileMsg.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-start space-x-3 text-xs font-semibold ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-250 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300'
                  : 'bg-rose-50 border border-rose-250 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving…' : 'Save Profile Info'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-blue-500" />
              Update Password
            </h4>

            {passwordMsg.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-start space-x-3 text-xs font-semibold ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-250 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300'
                  : 'bg-rose-50 border border-rose-250 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <FieldLabel required>Current Password</FieldLabel>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>New Password</FieldLabel>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Confirm New Password</FieldLabel>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? 'Saving…' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
