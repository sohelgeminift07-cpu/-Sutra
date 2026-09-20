import { PDFDocument } from "pdf-lib";

export interface ThumbnailItem {
  page: number;
  dataUrl: string;
}

// Lazy-load pdfjs only in browser
let pdfjsModule: typeof import("pdfjs-dist") | null = null;

async function getPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("PDF processing is only supported in browser");
  }
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist");
    try {
      if (!pdfjsModule.GlobalWorkerOptions.workerSrc) {
        pdfjsModule.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsModule.version}/build/pdf.worker.min.mjs`;
      }
    } catch {
      // Fallback
    }
  }
  return pdfjsModule;
}

/** Get total page count */
export async function getPdfMeta(file: File): Promise<{ numPages: number }> {
  try {
    const pdfjs = await getPdfJs();
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const numPages = doc.numPages;
    try {
      const docWithCleanup = doc as unknown as { cleanup?: () => Promise<void>; destroy?: () => Promise<void> };
      if (typeof docWithCleanup.destroy === "function") await docWithCleanup.destroy();
      else if (typeof docWithCleanup.cleanup === "function") await docWithCleanup.cleanup();
    } catch {
      // ignore
    }
    return { numPages };
  } catch {
    // Fallback using pdf-lib if pdfjs worker hits CORS/offline issue
    const buf = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
    return { numPages: pdfDoc.getPageCount() };
  }
}

/** Render page thumbnails */
export async function renderThumbnails(
  file: File,
  maxPages = 40,
  width = 140
): Promise<{ thumbnails: ThumbnailItem[]; total: number }> {
  try {
    const pdfjs = await getPdfJs();
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const total = doc.numPages;
    const count = Math.min(total, maxPages);
    const thumbnails: ThumbnailItem[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({
            canvasContext: ctx,
            canvas,
            viewport,
          } as unknown as Parameters<typeof page.render>[0]).promise;
          thumbnails.push({
            page: i,
            dataUrl: canvas.toDataURL("image/jpeg", 0.55),
          });
        }
      } catch (err) {
        console.warn(`Failed rendering thumbnail for page ${i}`, err);
      }
    }
    try {
      const docWithCleanup = doc as unknown as { cleanup?: () => Promise<void>; destroy?: () => Promise<void> };
      if (typeof docWithCleanup.destroy === "function") await docWithCleanup.destroy();
      else if (typeof docWithCleanup.cleanup === "function") await docWithCleanup.cleanup();
    } catch {
      // ignore
    }
    return { thumbnails, total };
  } catch (err) {
    console.warn("Could not generate page thumbnails via pdfjs:", err);
    return { thumbnails: [], total: 1 };
  }
}

const BN = "০১২৩৪৫৬৭৮৯";
function normalizeDigits(str: string): string {
  return String(str || "").replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
}

/** Parse page range string like "1-5, 8, ১০-১২" */
export function parsePageSelection(input: string, maxPage: number): number[] {
  const str = normalizeDigits(input).trim();
  if (!str) return [];
  const set = new Set<number>();

  for (const part of str.split(/[,;।\s]+/)) {
    if (!part) continue;
    const range = part.match(/^(\d+)\s*[-–—:]\s*(\d+)$/);
    if (range) {
      let a = Number(range[1]);
      let b = Number(range[2]);
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p++) {
        if (p >= 1 && p <= maxPage) set.add(p);
      }
    } else if (/^\d+$/.test(part)) {
      const p = Number(part);
      if (p >= 1 && p <= maxPage) set.add(p);
    }
  }

  return [...set].sort((x, y) => x - y);
}

/** Extract selected pages from PDF into a new PDF Blob using pdf-lib */
export async function extractPages(file: File, pages: number[]): Promise<Blob> {
  const srcBytes = await file.arrayBuffer();
  const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pageCount = src.getPageCount();

  const indexes = [...new Set(pages)]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b)
    .map((p) => p - 1);

  if (!indexes.length) throw new Error("কোনো বৈধ পাতা পাওয়া যায়নি");

  const copied = await out.copyPages(src, indexes);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

/** Convert Blob to pure Base64 string without data URL prefix */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("ফাইল Base64 এ রূপান্তর করা যায়নি।"));
    reader.readAsDataURL(blob);
  });
}
