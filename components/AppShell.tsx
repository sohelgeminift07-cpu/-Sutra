"use client";

import { useEffect, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SettingsModal from "./SettingsModal";
import SampleMapsModal from "./SampleMapsModal";
import Toasts from "./Toasts";
import { useAppStore } from "@/store/useAppStore";

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getDesktopSnapshot() {
  return window.innerWidth >= 1024;
}

function getDesktopServerSnapshot() {
  return false;
}

function subscribeMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

// Dynamically import MindMapCanvas to prevent any SSR canvas/DOM mismatch issues
const MindMapCanvas = dynamic(() => import("./MindMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-app)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="font-mono text-[12px] text-[var(--tx-faint)]">ক্যানভাস প্রস্তুত হচ্ছে…</p>
      </div>
    </div>
  ),
});

export default function AppShell() {
  const theme = useAppStore((s) => s.theme);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const fetchModels = useAppStore((s) => s.fetchModels);
  const nodes = useAppStore((s) => s.nodes);
  const loadSampleMap = useAppStore((s) => s.loadSampleMap);

  const isDesktop = useSyncExternalStore(
    subscribeResize,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getMountedServerSnapshot
  );

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    if (nodes.length === 0) {
      loadSampleMap("liberation_war_1971");
    }
  }, [nodes.length, loadSampleMap]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--tx-ink)]">
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        {/* Desktop in-flow sidebar with smooth slide/collapse */}
        <AnimatePresence initial={false}>
          {mounted && isDesktop && sidebarOpen && (
            <motion.div
              key="desktop-sidebar-wrapper"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full shrink-0 overflow-hidden border-r border-[var(--bd-line)] bg-[var(--bg-panel)] z-20"
            >
              <div className="w-[340px] h-full">
                <Sidebar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile / Tablet overlay drawer with smooth swipe & backdrop */}
        <AnimatePresence>
          {mounted && !isDesktop && sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="mobile-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 top-14 z-30 bg-black/60 backdrop-blur-[2px]"
                aria-label="সাইডবার লুকান"
              />

              {/* Sliding Drawer */}
              <motion.div
                key="mobile-sidebar-drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{
                  type: "spring",
                  damping: 28,
                  stiffness: 300,
                  mass: 0.8,
                }}
                className="fixed inset-y-0 left-0 top-14 z-40 w-[min(360px,88vw)] max-w-full h-[calc(100vh-3.5rem)] shadow-2xl border-r border-[var(--bd-line)] bg-[var(--bg-panel)] overflow-hidden"
              >
                <Sidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Canvas */}
        <main className="min-w-0 flex-1 relative h-full w-full">
          <MindMapCanvas />
        </main>
      </div>
      <SettingsModal />
      <SampleMapsModal />
      <Toasts />
    </div>
  );
}
