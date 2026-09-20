"use client";

import { useRef, useState } from "react";
import {
  ClipboardPaste,
  Trash2,
  Sparkles,
  Check,
  FileText,
  Copy,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { bn } from "@/lib/format";
import { cn } from "@/lib/utils";

const SAMPLE_HISTORICAL_TEXT = `১৯৭১ সালের ৭ই মার্চ ঢাকার রেসকোর্স ময়দানে বঙ্গবন্ধু শেখ মুজিবুর রহমান এক ঐতিহাসিক ভাষণ দেন। তিনি বলেন, "এবারের সংগ্রাম আমাদের মুক্তির সংগ্রাম, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম।" 

এরপর ২৫শে মার্চ কালরাতে পাকিস্তানি হানাদার বাহিনী 'অপারেশন সার্চলাইট' চালিয়ে ঢাকাসহ সারাদেশে বর্বরোচিত গণহত্যা শুরু করে। ২৬শে মার্চ প্রথম প্রহরে বঙ্গবন্ধু বাংলাদেশের স্বাধীনতা ঘোষণা করেন। 

১০ই এপ্রিল প্রবাসী মুজিবনগর সরকার গঠিত হয় এবং ১৭ই এপ্রিল মেহেরপুরের বৈদ্যনাথতলায় এ সরকার আনুষ্ঠানিকভাবে শপথ গ্রহণ করে। 

দীর্ঘ নয় মাসের রক্তক্ষয়ী সশস্ত্র মুক্তিযুদ্ধের পর ১৬ই ডিসেম্বর ১৯৭১ সালে ঢাকার রেসকোর্স ময়দানে ৯৩ হাজার পাকিস্তানি সৈন্য নিঃশর্ত আত্মসমর্পণ করে এবং স্বাধীন সার্বভৌম বাংলাদেশ চূড়ান্ত বিজয় অর্জন করে।`;

export default function TextInputBox() {
  const pastedText = useAppStore((s) => s.pastedText);
  const setPastedText = useAppStore((s) => s.setPastedText);
  const clearPastedText = useAppStore((s) => s.clearPastedText);
  const toast = useAppStore((s) => s.toast);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [justPasted, setJustPasted] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const trimmed = pastedText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const charCount = pastedText.length;

  // One-click clipboard paste
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (!text || !text.trim()) {
          toast("info", "ক্লিপবোর্ডে কোনো টেক্সট পাওয়া যায়নি। প্রথমে কোনো লেখা কপি করুন।");
          textareaRef.current?.focus();
          return;
        }
        setPastedText(text);
        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 2000);
        toast("success", "ক্লিপবোর্ড থেকে লেখা সফলভাবে পেস্ট করা হয়েছে!");
      } else {
        textareaRef.current?.focus();
        toast("info", "ক্লিপবোর্ড অ্যাক্সেস অনুমোদিত নয়। সরাসরি টেক্সটবক্সে পেস্ট (Ctrl+V) করুন।");
      }
    } catch (err: unknown) {
      console.warn("Clipboard read error:", err);
      textareaRef.current?.focus();
      toast("info", "ব্রাউজারের সুরক্ষাজনিত কারণে সরাসরি টেক্সটবক্সে পেস্ট (Ctrl+V) করুন।");
    }
  };

  // One-click delete / clear
  const handleClear = () => {
    if (!pastedText) return;
    clearPastedText();
    toast("info", "টেক্সট বক্সের লেখা মুছে ফেলা হয়েছে");
    textareaRef.current?.focus();
  };

  // One-click copy text
  const handleCopy = async () => {
    if (!pastedText) return;
    try {
      await navigator.clipboard.writeText(pastedText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
      toast("success", "টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে");
    } catch {
      toast("error", "কপি করতে সমস্যা হয়েছে");
    }
  };

  // Load rich sample text in 1-click
  const handleLoadSample = () => {
    setPastedText(SAMPLE_HISTORICAL_TEXT);
    toast("success", "১৯৭১ সালের মুক্তিযুদ্ধের নমুনা ইতিহাস নোট লোড হয়েছে!");
  };

  return (
    <div className="space-y-2.5">
      {/* Action Control Bar for One-Click Actions */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)]/80 p-1.5">
        <div className="flex items-center gap-1">
          {/* One-click Paste Button */}
          <button
            id="one-click-paste-btn"
            type="button"
            onClick={handlePasteFromClipboard}
            className="btn-press flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 dark:text-amber-300 transition-all hover:bg-amber-500/20 active:scale-[0.98]"
            title="ক্লিপবোর্ড থেকে সরাসরি পেস্ট করুন (১-ক্লিক)"
          >
            {justPasted ? (
              <>
                <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>পেস্ট সম্পন্ন!</span>
              </>
            ) : (
              <>
                <ClipboardPaste size={13} />
                <span>ক্লিপবোর্ড পেস্ট</span>
              </>
            )}
          </button>

          {/* One-click Delete Button */}
          <button
            id="one-click-delete-btn"
            type="button"
            onClick={handleClear}
            disabled={!pastedText}
            className={cn(
              "btn-press flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px] font-medium transition-all",
              pastedText
                ? "border-[var(--danger)]/35 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                : "border-transparent text-[var(--tx-faint)] cursor-not-allowed opacity-40"
            )}
            title="সব টেক্সট মুছে ফেলুন (১-ক্লিক)"
          >
            <Trash2 size={13} />
            <span>মুছে ফেলুন</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Copy Text Button */}
          {pastedText && (
            <button
              id="copy-text-btn"
              type="button"
              onClick={handleCopy}
              className="btn-press flex items-center gap-1 rounded-lg border border-[var(--bd-line)] bg-[var(--bg-panel)] px-2 py-1 text-[11px] font-medium text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
              title="লেখা কপি করুন"
            >
              {justCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          )}

          {/* One-click Sample Button */}
          <button
            id="load-sample-text-btn"
            type="button"
            onClick={handleLoadSample}
            className="btn-press flex items-center gap-1 rounded-lg border border-[var(--bd-line)] bg-[var(--bg-panel)] px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:bg-[var(--bg-panel2)]"
            title="পরীক্ষা করার জন্য নমুনা টেক্সট বসান"
          >
            <Sparkles size={11} />
            <span>নমুনা নোট</span>
          </button>
        </div>
      </div>

      {/* Main Text Input Box */}
      <div className="relative rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)]/40 p-2 focus-within:border-amber-500/70 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
        <textarea
          id="mindmap-text-input"
          ref={textareaRef}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="যেকোনো বইয়ের অনুচ্ছেদ, ইতিহাসের সারসংক্ষেপ, ক্লাসের লেকচার, প্রবন্ধ বা নোট এখানে পেস্ট বা টাইপ করুন...&#10;&#10;💡 ওপরের 'ক্লিপবোর্ড পেস্ট' বাটনে ১-ক্লিক করেই পেস্ট করতে পারবেন।"
          rows={7}
          className="w-full resize-y bg-transparent text-[12.5px] leading-relaxed text-[var(--tx-ink)] placeholder:text-[var(--tx-faint)] focus:outline-hidden min-h-[140px] max-h-[380px]"
        />

        {/* Floating Quick Paste Prompt when box is completely empty */}
        {!pastedText && (
          <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-center justify-between text-[11px] text-[var(--tx-faint)]">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              <span>বাংলা বা ইংরেজি যেকোনো টেক্সট সমর্থিত</span>
            </span>
            <span className="font-mono text-[10px]">Ctrl + V</span>
          </div>
        )}
      </div>

      {/* Stats and Control Bar */}
      <div className="flex items-center justify-between px-1 text-[11px] text-[var(--tx-mut)]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--tx-ink)]">
            {bn(wordCount)} শব্দ
          </span>
          <span className="text-[var(--tx-faint)]">•</span>
          <span>{bn(charCount)} অক্ষর</span>
        </div>

        {wordCount > 0 && wordCount < 10 && (
          <span className="text-[10.5px] text-amber-600 dark:text-amber-400">
            আরও বিস্তারিত তথ্যে ম্যাপ সমৃদ্ধ হবে
          </span>
        )}
      </div>
    </div>
  );
}
