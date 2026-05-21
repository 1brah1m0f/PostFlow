"use client";

import { useState, useEffect } from "react";
import {
  Instagram,
  Lock,
  Plus,
  Trash2,
  CheckCircle,
  Shield,
  AlertTriangle,
  User,
  Loader2,
  Users,
  Grid,
  Eye,
  X,
} from "lucide-react";
import {
  getAccounts,
  createAccount,
  deleteAccount,
  getProfile,
} from "@/lib/api";
import { Account } from "@/types";

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
  </svg>
);

interface ProfileData {
  full_name: string;
  username: string;
  profile_pic_url: string;
  follower_count: number;
  following_count: number;
  post_count: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface AddAccountFormProps {
  platform: "instagram" | "tiktok";
  onAdded: (account: Account) => void;
  onCancel: () => void;
}

function AddAccountForm({ platform, onAdded, onCancel }: AddAccountFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const account = await createAccount(platform, username, password);
      onAdded(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-brand-gray mb-1">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              className="input-base pl-9 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-gray mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-base pl-9 py-2 text-sm"
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="text-xs text-brand-rust flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="btn-primary py-2 text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add account
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary py-2 text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}

interface AccountRowProps {
  account: Account;
  onDelete: (id: string) => void;
  showPreview?: boolean;
}

function AccountRow({ account, onDelete, showPreview }: AccountRowProps) {
  const [deleting, setDeleting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileError, setProfileError] = useState("");

  const handleDelete = async () => {
    if (!confirm(`Remove @${account.username}?`)) return;
    setDeleting(true);
    try {
      await deleteAccount(account.id);
      onDelete(account.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = async () => {
    setProfileLoading(true);
    setProfileData(null);
    setProfileError("");
    try {
      const data = await getProfile(account.id);
      setProfileData(data);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-peach flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-brand-dark" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">@{account.username}</p>
            <p className="text-xs text-brand-gray">
              Added {new Date(account.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showPreview && (
            <button
              onClick={handlePreview}
              disabled={profileLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-brand-dark hover:border-brand-peach transition-colors"
            >
              {profileLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              Preview
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {profileError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle className="w-3.5 h-3.5 text-brand-rust flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-rust">{profileError}</p>
        </div>
      )}

      {profileData && (
        <div className="p-3 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            {profileData.profile_pic_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileData.profile_pic_url}
                alt={profileData.username}
                loading="lazy"
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand-peach flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-brand-dark" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-dark truncate">
                {profileData.full_name || profileData.username}
              </p>
              <p className="text-xs text-brand-gray">@{profileData.username}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-brand-dark font-semibold">
                  <Grid className="w-3 h-3 text-brand-gray" />
                  {formatCount(profileData.post_count)}
                  <span className="font-normal text-brand-gray">posts</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-brand-dark font-semibold">
                  <Users className="w-3 h-3 text-brand-gray" />
                  {formatCount(profileData.follower_count)}
                  <span className="font-normal text-brand-gray">followers</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showAddIG, setShowAddIG] = useState(false);
  const [showAddTT, setShowAddTT] = useState(false);

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoadingAccounts(false));
  }, []);

  const igAccounts = accounts.filter((a) => a.platform === "instagram");
  const ttAccounts = accounts.filter((a) => a.platform === "tiktok");

  const handleAdded = (account: Account) => {
    setAccounts((prev) => [...prev, account]);
    if (account.platform === "instagram") setShowAddIG(false);
    else setShowAddTT(false);
  };

  const handleDeleted = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-xl animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>
        <p className="text-sm text-brand-gray mt-0.5">Manage your connected social accounts.</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm mb-5">
        <Shield className="w-4 h-4 text-brand-rust flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-dark">Encrypted Storage</p>
          <p className="text-xs text-brand-gray mt-0.5">
            Credentials are encrypted at rest using Fernet symmetric encryption. Passwords are never returned by the API.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Instagram */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-peach flex items-center justify-center flex-shrink-0">
                <Instagram className="w-4 h-4 text-brand-dark" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark">Instagram Accounts</h3>
                <p className="text-xs text-brand-gray">
                  {igAccounts.length} account{igAccounts.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            {!showAddIG && (
              <button
                onClick={() => setShowAddIG(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-brand-dark hover:border-brand-rust hover:text-brand-rust transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-sm text-brand-gray py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-2">
              {igAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onDelete={handleDeleted}
                  showPreview
                />
              ))}
              {igAccounts.length === 0 && !showAddIG && (
                <p className="text-xs text-brand-gray py-1">No Instagram accounts added yet.</p>
              )}
            </div>
          )}

          {showAddIG && (
            <AddAccountForm
              platform="instagram"
              onAdded={handleAdded}
              onCancel={() => setShowAddIG(false)}
            />
          )}
        </div>

        {/* TikTok */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-peach flex items-center justify-center flex-shrink-0">
                <TikTokIcon />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark">TikTok Accounts</h3>
                <p className="text-xs text-brand-gray">
                  {ttAccounts.length} account{ttAccounts.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            {!showAddTT && (
              <button
                onClick={() => setShowAddTT(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-brand-dark hover:border-brand-rust hover:text-brand-rust transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-sm text-brand-gray py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-2">
              {ttAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onDelete={handleDeleted}
                />
              ))}
              {ttAccounts.length === 0 && !showAddTT && (
                <p className="text-xs text-brand-gray py-1">No TikTok accounts added yet.</p>
              )}
            </div>
          )}

          {showAddTT && (
            <AddAccountForm
              platform="tiktok"
              onAdded={handleAdded}
              onCancel={() => setShowAddTT(false)}
            />
          )}
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-brand-rust flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-gray leading-relaxed">
            Both platforms may require login verification for automated sign-ins. 2FA is not supported.
          </p>
        </div>
      </div>
    </div>
  );
}
