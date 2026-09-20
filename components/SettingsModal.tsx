"use client";

import { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  Cpu,
  RefreshCw,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { shortModel } from "@/lib/format";

export default function SettingsModal() {
  const open = useAppStore((s) => s.settingsOpen);
  const setOpen = useAppStore((s) => s.setSettingsOpen);

  const apiKey = useAppStore((s) => s.apiKey);
  const saveApiKey = useAppStore((s) => s.saveApiKey);
  const clearApiKey = useAppStore((s) => s.clearApiKey);
  const hasServerKey = useAppStore((s) => s.hasServerKey);

  const model = useAppStore((s) => s.model);
  const setModel = useAppStore((s) => s.setModel);
  const models = useAppStore((s) => s.models);
  const modelsLoading = useAppStore((s) => s.modelsLoading);
  const modelsError = useAppStore((s) => s.modelsError);
  const fetchModels = useAppStore((s) => s.fetchModels);
  const toast = useAppStore((s) => s.toast);

  const [draftKey, setDraftKey] = useState(apiKey);
  const [prevApiKey, setPrevApiKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  if (apiKey !== prevApiKey) {
    setPrevApiKey(apiKey);
    setDraftKey(apiKey);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const keyDirty = draftKey.trim() !== apiKey;

  const handleSaveKey = async () => {
    setSavingKey(true);
    await saveApiKey(draftKey);
    setSavingKey(false);
    if (draftKey.trim()) {
      toast("success", "কাস্টম API Key সেভ হয়েছে");
    } else {
      toast("info", "কাস্টম Key সরানো হয়েছে (সার্ভার ডিফল্ট ব্যবহৃত হবে)");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px] select-none"
      onClick={() => setOpen(false)}
    >
      <div
        className="anim-pop max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-2xl border border-[var(--bd-line)] bg-[var(--bg-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--bd-soft)] bg-[var(--bg-panel)] px-5 py-4 z-10">
          <div>
            <h2 className="text-[17px] font-bold text-[var(--tx-ink)]">
              সেটিংস ও এআই কনফিগারেশন
            </h2>
            <p className="text-[11.5px] text-[var(--tx-faint)]">
              Gemini মডেল ও সংযোগের বিশদ বিবরণ
            </p>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={() => setOpen(false)}
            title="বন্ধ করুন (Esc)"
            className="btn-press flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--bd-line)] text-[var(--tx-mut)] hover:text-[var(--tx-ink)] hover:bg-[var(--bg-panel2)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* AI Studio Key Status */}
          <div className="rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)] p-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-[var(--tx-ink)]">
                  {hasServerKey
                    ? "সার্ভার-সাইড Gemini সংযোগ সক্রিয়"
                    : "সার্ভার পরিবেশ প্রস্তুত"}
                </p>
                <p className="text-[11.5px] leading-relaxed text-[var(--tx-mut)] mt-0.5">
                  অ্যাপ্লিকেশনটি সার্ভার-সাইড প্রক্সি API রুটের মাধ্যমে সুরক্ষিতভাবে Gemini-র সাথে যুক্ত। কোনো কোড বা ক্লায়েন্টে কী প্রকাশ পায় না।
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="gemini-model-select"
                className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--tx-ink)]"
              >
                <Cpu size={14} className="text-amber-600 dark:text-amber-400" />
                Gemini মডেল নির্বাচন
              </label>

              <button
                id="refresh-models-btn"
                onClick={() => fetchModels()}
                disabled={modelsLoading}
                title="মডেল তালিকা রিফ্রেশ করুন"
                className="btn-press flex items-center gap-1 rounded-md border border-[var(--bd-line)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tx-mut)] hover:text-[var(--tx-ink)] disabled:opacity-40"
              >
                <RefreshCw size={11} className={modelsLoading ? "anim-spin" : ""} />
                রিফ্রেশ
              </button>
            </div>

            <div className="relative">
              <select
                id="gemini-model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!models.length || modelsLoading}
                className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-[var(--bd-line)] bg-[var(--bg-raise)] pr-8 pl-3 font-mono text-[12px] text-[var(--tx-ink)] focus:border-[var(--ac)] focus:outline-hidden disabled:opacity-50"
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.displayName ? m.displayName : shortModel(m.name)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[var(--tx-faint)]"
              />
            </div>

            {modelsError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle size={12} />
                লাইভ তালিকা পেতে সমস্যা হয়েছে, ডিফল্ট নির্ভরযোগ্য মডেল তালিকা দেখানো হচ্ছে।
              </p>
            )}
          </div>

          {/* Optional Custom API Key */}
          <div className="space-y-2 border-t border-[var(--bd-soft)] pt-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="custom-api-key-input"
                className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--tx-ink)]"
              >
                <KeyRound size={14} className="text-[var(--tx-mut)]" />
                কাস্টম API Key (ঐচ্ছিক ওভাররাইড)
              </label>

              {apiKey && (
                <button
                  id="clear-custom-api-key-btn"
                  onClick={() => {
                    clearApiKey();
                    setDraftKey("");
                    toast("info", "কাস্টম Key মুছে ফেলা হয়েছে");
                  }}
                  className="flex items-center gap-1 text-[11px] text-[var(--danger)] hover:underline"
                >
                  <Trash2 size={11} /> মুছুন
                </button>
              )}
            </div>

            <div className="flex gap-1.5">
              <div className="relative min-w-0 flex-1">
                <input
                  id="custom-api-key-input"
                  type={showKey ? "text" : "password"}
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder="AIzaSy… (না দিলে সার্ভার ডিফল্ট ব্যবহৃত হবে)"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-9 w-full rounded-lg border border-[var(--bd-line)] bg-[var(--bg-raise)] pr-9 pl-3 font-mono text-[12px] text-[var(--tx-ink)] placeholder:text-[var(--tx-faint)] focus:border-[var(--ac)] focus:outline-hidden"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? "লুকান" : "দেখান"}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[var(--tx-faint)] hover:text-[var(--tx-ink)]"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                id="save-custom-api-key-btn"
                onClick={handleSaveKey}
                disabled={savingKey || !keyDirty}
                className="btn-press flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--ac)] px-3 text-[12px] font-bold text-[var(--ac-ink)] disabled:opacity-40"
              >
                <Save size={13} />
                সেভ
              </button>
            </div>
          </div>

          {/* Language Tone Standard */}
          <div className="rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)] p-3.5 space-y-1 text-[11.5px] leading-relaxed text-[var(--tx-mut)]">
            <p className="flex items-center gap-1.5 font-bold text-[var(--tx-ink)]">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
              ভাষার ধরন: সহজবোধ্য ও মানুষের মতো স্বাভাবিক বাংলা
            </p>
            <p>
              Gemini এআই প্রতিটি নোড ও বিবরণে কঠিন সাধু বা যান্ত্রিক রোবোটিক অনুবাদ পরিহার করে মানুষের মুখের মতো সহজ, প্রাঞ্জল ও পরিষ্কার চলিত বাংলা ব্যবহার করবে।
            </p>
          </div>

          {/* Security Note */}
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/8 p-3.5 space-y-1.5 text-[11.5px] leading-relaxed text-[var(--tx-mut)]">
            <p className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
              <ShieldCheck size={14} />
              নিরাপত্তা ও গোপনীয়তা
            </p>
            <p>
              আপনার ডকুমেন্টের পাতাগুলো ক্লায়েন্ট সাইডে প্রক্রিয়াজাত হয়ে শুধুমাত্র প্রয়োজনীয় অংশ এআই বিশ্লেষণের জন্য পাঠানো হয়। কোনো ডেটা বহিরাগত অন্য কোনো সার্ভারে সংরক্ষিত হয় না।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
