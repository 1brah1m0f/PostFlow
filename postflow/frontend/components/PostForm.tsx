"use client";

import { createPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import {
  Upload,
  ImageIcon,
  X,
  Calendar,
  Clock,
  Type,
  Instagram,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react";

export function PostForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Form fields
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ig_username") || "";
    }
    return "";
  });
  const [password, setPassword] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ig_password") || "";
    }
    return "";
  });

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG)");
      return;
    }
    setImage(file);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!caption.trim()) return setError("Caption is required");
    if (!image) return setError("Image is required");
    if (!scheduleDate) return setError("Schedule date is required");
    if (!scheduleTime) return setError("Schedule time is required");
    if (!username.trim()) return setError("Instagram username is required");
    if (!password.trim()) return setError("Instagram password is required");

    setIsSubmitting(true);

    try {
      // Save credentials to localStorage
      localStorage.setItem("ig_username", username);
      localStorage.setItem("ig_password", password);

      // Build FormData
      const formData = new FormData();
      formData.append("instagram_username", username);
      formData.append("instagram_password", password);
      formData.append("caption", caption);
      formData.append("image", image);
      formData.append("scheduled_at", `${scheduleDate}T${scheduleTime}:00`);

      await createPost(formData);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Create New Post</h1>
        <p className="text-brand-gray mt-1">Schedule your next Instagram post.</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-brand-rust text-sm flex items-center gap-2 animate-slide-up">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Image Upload */}
      <div className="glass-card p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-3">
          <ImageIcon className="w-4 h-4 text-brand-rust" />
          Post Image
        </label>

        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-brand-cream group">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur-sm
                         text-brand-dark hover:text-brand-rust hover:bg-red-50
                         transition-all duration-200 shadow-sm
                         opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-12
              flex flex-col items-center justify-center gap-3
              cursor-pointer transition-all duration-300
              ${
                dragOver
                  ? "border-brand-peach bg-brand-peach/10"
                  : "border-brand-cream hover:border-brand-peach hover:bg-brand-cream/30"
              }
            `}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                dragOver
                  ? "bg-brand-peach text-brand-dark"
                  : "bg-brand-cream text-brand-gray"
              }`}
            >
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-brand-dark">
                Drag & drop your image here
              </p>
              <p className="text-xs text-brand-gray mt-1">
                or click to browse · JPG, PNG
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
        />
      </div>

      {/* Caption */}
      <div className="glass-card p-6">
        <label
          htmlFor="caption-input"
          className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-3"
        >
          <Type className="w-4 h-4 text-brand-rust" />
          Caption
        </label>
        <div className="relative">
          <textarea
            id="caption-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a captivating caption for your post..."
            rows={4}
            maxLength={2200}
            className="input-base resize-none min-h-[120px]"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-xs text-brand-gray">
              <Sparkles className="w-3 h-3" />
              <span>Make it engaging</span>
            </div>
            <span
              className={`text-xs font-medium ${
                caption.length > 2000 ? "text-brand-rust" : "text-brand-gray"
              }`}
            >
              {caption.length}/2,200
            </span>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="glass-card p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-3">
          <Calendar className="w-4 h-4 text-brand-rust" />
          Schedule
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="schedule-date"
              className="block text-xs font-medium text-brand-gray mb-1.5"
            >
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
              <input
                type="date"
                id="schedule-date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="schedule-time"
              className="block text-xs font-medium text-brand-gray mb-1.5"
            >
              Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
              <input
                type="time"
                id="schedule-time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Credentials */}
      <div className="glass-card p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-dark mb-1">
          <Instagram className="w-4 h-4 text-brand-rust" />
          Instagram Account
        </label>
        <p className="text-xs text-brand-gray mb-4">
          Credentials are stored locally in your browser
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ig-username"
              className="block text-xs font-medium text-brand-gray mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
              <input
                type="text"
                id="ig-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="input-base pl-10"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="ig-password"
              className="block text-xs font-medium text-brand-gray mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
              <input
                type="password"
                id="ig-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="btn-secondary"
          id="cancel-post"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          id="submit-post"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              Schedule Post
            </>
          )}
        </button>
      </div>
    </form>
  );
}
