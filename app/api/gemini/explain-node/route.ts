import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_INSTRUCTION = `তুমি একজন অমায়িক, অভিজ্ঞ শিক্ষক ও তথ্য-বিশ্লেষক।
তোমার দায়িত্ব হলো মাইন্ড ম্যাপের একটি নির্দিষ্ট নোড সম্পর্কে মূল সোর্স বা ঐতিহাসিক তথ্যের আলোকে অত্যন্ত সহজ, প্রাঞ্জল ও মানুষের মতো স্বাভাবিক চলিত বাংলায় বিস্তারিত ব্যাখ্যা করা।

নিয়মাবলী:
১. মানুষের মুখের মতো স্বাভাবিক ও প্রাঞ্জল ভাষায় কথা বলো। কোনো কঠিন সাধু বা যান্ত্রিক রোবোটিক শব্দ পরিহার করো।
২. মূল সোর্সের আলোকে ৩টি ভাগে সহজবোধ্য করে উপস্থাপন করো:
   - মূল ঘটনা ও প্রেক্ষাপট (কী হয়েছিল এবং কেন হয়েছিল)
   - মূল সোর্সের গুরুত্বপূর্ণ তথ্য বা তাৎপর্য
   - পরবর্তী প্রভাব বা ফলাফল
৩. উত্তরটি গল্পের মতো সহজ ও স্পষ্ট হতে হবে, যেন যে কেউ পড়ে এক নিমেষে পুরো বিষয়টি বুঝতে পারে।`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "সার্ভারে GEMINI_API_KEY কনফিগার করা নেই।" },
        { status: 500 }
      );
    }

    const {
      label,
      kind,
      date,
      detail,
      mapName,
      pdfBase64,
    } = await req.json();

    if (!label) {
      return NextResponse.json(
        { error: "নোডের নাম (label) আবশ্যক।" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
বিষয়: ${mapName || "মাইন্ড ম্যাপ"}
নোড: "${label}"
নোডের ধরন: ${kind || "ঘটনা"}
তারিখ/সময়কাল: ${date || "উল্লেখ নেই"}
সংক্ষিপ্ত তথ্য: ${detail || "উল্লেখ নেই"}

অনুরোধ:
মেইন সোর্সের (সংযুক্ত PDF বা ঐতিহাসিক দলিলের) আলোকে এই নির্দিষ্ট নোডটির সম্পূর্ণ প্রেক্ষাপট, কী ঘটেছিল এবং এর ঐতিহাসিক বা ধারণাগত তাৎপর্য অত্যন্ত সহজ, মনোগ্রাহী ও মানুষের মতো স্বাভাবিক বাংলায় বিস্তারিত ব্যাখ্যা করো।
`;

    const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (pdfBase64) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      });
    }

    contents.push({ text: promptText });

    const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
    let responseText = "";

    for (const model of modelsToTry) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.35,
          },
        });
        if (res.text) {
          responseText = res.text;
          break;
        }
      } catch (err) {
        console.warn(`Explain node fallback from ${model}:`, err);
      }
    }

    if (!responseText) {
      return NextResponse.json(
        { error: "দুঃখিত, এই মুহূর্তে বিস্তারিত ব্যাখ্যা তৈরি করা সম্ভব হয়নি।" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      explanation: responseText,
    });
  } catch (err: unknown) {
    console.error("Explain node error:", err);
    return NextResponse.json(
      { error: "বিস্তারিত ব্যাখ্যা তৈরিতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
