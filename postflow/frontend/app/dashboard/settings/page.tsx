"use client";

import { useState, useEffect } from "react";
import { Instagram, Lock, Save, CheckCircle, Shield, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem("ig_username") || "");
    setPassword(localStorage.getItem("ig_password") || "");
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ig_username", username);
    localStorage.setItem("ig_password", password);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>
        <p className="text-brand-gray mt-1">Configure your automation credentials.</p>
      </div>

      {/* Success Toast */}
      {saved && (
        <div className="fixed top-20 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-brand-cream border border-[#D5D6B5] text-brand-dark shadow-lg shadow-brand-dark/10">
            <CheckCircle className="w-5 h-5 text-[#5C715E]" />
            <span className="text-sm font-semibold">Credentials saved successfully</span>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-peach flex items-center justify-center shadow-sm flex-shrink-0">
            <Instagram className="w-6 h-6 text-brand-dark" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark">Instagram Credentials</h3>
            <p className="text-sm text-brand-gray mt-1">
              Enter your Instagram username and password. These are used to
              automatically publish your scheduled posts via browser automation.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-cream border border-[#D5D6B5]">
        <Shield className="w-5 h-5 text-brand-dark flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-dark">Local Storage Only</p>
          <p className="text-xs text-brand-dark/80 mt-0.5">
            Your credentials are stored locally in your browser&apos;s localStorage.
            They are never sent to any external server — only to the local backend
            when scheduling a post.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="glass-card p-6 space-y-5">
        <div>
          <label
            htmlFor="settings-username"
            className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-2"
          >
            <Instagram className="w-4 h-4 text-brand-rust" />
            Instagram Username
          </label>
          <input
            type="text"
            id="settings-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            className="input-base"
          />
        </div>

        <div>
          <label
            htmlFor="settings-password"
            className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-2"
          >
            <Lock className="w-4 h-4 text-brand-rust" />
            Instagram Password
          </label>
          <input
            type="password"
            id="settings-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-base"
          />
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-50 border border-brand-cream">
          <AlertTriangle className="w-4 h-4 text-brand-rust flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-gray leading-relaxed">
            Instagram may require you to verify your login via email or phone if
            it detects an automated sign-in. Two-factor authentication is not
            currently supported.
          </p>
        </div>

        <button type="submit" className="btn-primary w-full" id="save-credentials">
          <Save className="w-4 h-4" />
          Save Credentials
        </button>
      </form>
    </div>
  );
}
