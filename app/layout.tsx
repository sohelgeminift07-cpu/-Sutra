import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sutra - PDF to AI Mind Map | সূত্র — PDF → AI মাইন্ড ম্যাপ',
  description: 'Transform PDF documents and books into interactive chronological AI mind maps with concept nodes, chronological branching, and visual export.',
  openGraph: {
    title: 'Sutra - PDF to AI Mind Map | সূত্র — PDF → AI মাইন্ড ম্যাপ',
    description: 'Transform PDF documents and books into interactive chronological AI mind maps with concept nodes, chronological branching, and visual export.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sutra - PDF to AI Mind Map | সূত্র — PDF → AI মাইন্ড ম্যাপ',
    description: 'Transform PDF documents and books into interactive chronological AI mind maps with concept nodes, chronological branching, and visual export.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = JSON.parse(localStorage.getItem("sutra-store-v1") || "null");
                if (!s || !s.state || s.state.theme !== "light") document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-amber-500/30 overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
