import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { MIND_MAP_PROMPT } from "@/lib/prompts/mindMapPrompt";
import { MIND_MAP_SCHEMA } from "@/lib/prompts/mindMapSchema";

function stripFences(text: string): string {
  const t = String(text || "").trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (m ? m[1] : t).trim();
}

function isHighDemandOrTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || "");
  return /503|UNAVAILABLE|high demand|overloaded|spikes in demand|temporarily unavailable|try again later|resource.*exhausted|rate limit|429/i.test(
    msg
  );
}

function getFallbackModels(primary: string): string[] {
  const p = primary.trim().toLowerCase();
  const models = [];
  if (p.includes("3.8-flash")) {
    models.push("gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest");
  } else if (p.includes("2.5-flash")) {
    models.push("gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash");
  } else if (p.includes("pro")) {
    models.push("gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.8-flash");
  } else {
    models.push("gemini-2.5-flash", "gemini-3.8-flash");
  }
  // Filter out the primary itself
  return models.filter((m) => m.toLowerCase() !== p);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, textContent, model: requestedModel, apiKeyOverride, customPrompt } = body;

    const apiKey = apiKeyOverride?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে Settings-এ একটি API key প্রদান করুন অথবা GEMINI_API_KEY সেট করুন।",
        },
        { status: 400 }
      );
    }

    if (!pdfBase64 && !textContent) {
      return NextResponse.json(
        { error: "কোনো PDF ডেটা বা টেক্সট পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const primaryModel = requestedModel?.trim() || "gemini-3.8-flash";
    const promptText = customPrompt || MIND_MAP_PROMPT;

    const contentsParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: promptText },
    ];

    if (pdfBase64) {
      contentsParts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      });
    } else if (textContent) {
      contentsParts.push({
        text: `ডকুমেন্টের টেক্সট:\n\n${textContent}`,
      });
    }

    const SYSTEM_INSTRUCTION = `তুমি একজন দক্ষ শিক্ষক ও তথ্য-বিশ্লেষক। তোমার একমাত্র লক্ষ্য হলো যেকোনো জটিল বা দীর্ঘ নথি থেকে তথ্য নিয়ে অতি সহজ, প্রাঞ্জল ও সাধারণ মানুষের বোধগম্য স্বাভাবিক চলিত বাংলায় তথ্যচিত্র বা মাইন্ড ম্যাপ তৈরি করা। 

কঠোর নিয়ম:
১. প্রাথমিক পর্যায়ে নোড তৈরির সময়ই প্রতিটি নোডের সাথে বাধ্যতামূলকভাবে 'sourceContext' প্রদান করতে হবে। এতে মূল সোর্স ডকুমেন্টের আলোকে নোডটির প্রেক্ষাপট, কারণ, ঘটনা ও পূর্ণ বিবরণ ৩-৫ বাক্যে লিখে দেবে, যাতে পরবর্তীতে কোনো অতিরিক্ত এআই রিকোয়েস্ট ছাড়াই ব্যবহারকারী নোড এক্সপ্যান্ড করলেই সাথে সাথে সম্পূর্ণ তথ্য পড়ে নিতে পারেন।
২. প্রতিটি নোডের লেবেল (label) এবং বিবরণ (detail) অবশ্যই মানুষের মুখের স্বাভাবিক চলিত বাংলায় হতে হবে — ঠিক যেভাবে সামনাসামনি একজন শিক্ষক বা বন্ধু সহজ বাংলায় বুঝিয়ে দেন।
৩. কোনো অবস্থাতেই যান্ত্রিক, রোবোটিক, কম্পিউটার-অনুবাদ বা দুর্বোধ্য কঠিন সাধু/ভারী সংস্কৃত শব্দ ব্যবহার করা যাবে না।
৪. ৩-৭ শব্দের সংক্ষিপ্ত ও স্পষ্ট লেবেল ব্যবহার করো এবং ১-২ বাক্যের সহজ বিবরণ প্রদান করো।
৫. নোডগুলোর মধ্যকার সংযোগের নাম (edge label) মানুষের মুখের ভাষায় লেখো (যেমন: 'যার ফলে', 'এর প্রতিবাদে', 'নেতৃত্বে ছিলেন', 'ঘটনাস্থল', 'মূল সিদ্ধান্ত', 'পরবর্তী পদক্ষেপ', 'চূড়ান্ত ফলাফল')।`;

    const runCall = async (modelToRun: string) => {
      return await ai.models.generateContent({
        model: modelToRun,
        contents: [
          {
            role: "user",
            parts: contentsParts,
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: MIND_MAP_SCHEMA,
        },
      });
    };

    let response = null;
    let actualModel = primaryModel;
    let fallbackNotice: string | null = null;
    let lastError: unknown = null;

    // Attempt 1: Primary Model
    try {
      response = await runCall(primaryModel);
    } catch (err) {
      lastError = err;

      if (isHighDemandOrTransient(err)) {
        console.log(`Model ${primaryModel} is experiencing high demand, initiating fallback...`);
        // Try fallback models
        const fallbacks = getFallbackModels(primaryModel);
        for (const fb of fallbacks) {
          try {
            console.log(`Attempting fallback model: ${fb}`);
            response = await runCall(fb);
            actualModel = fb;
            fallbackNotice = `${primaryModel} মডেলটিতে অতিরিক্ত চাপ থাকায় ${fb} দিয়ে বিশ্লেষণ সম্পন্ন হয়েছে।`;
            break;
          } catch {
            console.log(`Fallback ${fb} did not respond, trying next...`);
          }
        }

        // If fallbacks didn't succeed, wait 1500ms and try primary model once more
        if (!response) {
          try {
            await sleep(1500);
            response = await runCall(primaryModel);
          } catch (retryErr) {
            lastError = retryErr;
          }
        }
      } else {
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error("মডেল থেকে সাড়া পাওয়া যায়নি।");
    }

    const rawText = response.text;
    if (!rawText) {
      throw new Error("মডেল থেকে কোনো টেক্সট প্রতিক্রিয়া পাওয়া যায়নি।");
    }

    const cleaned = stripFences(rawText);
    const parsedData = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      data: parsedData,
      model: actualModel,
      fallbackNotice,
    });
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    const message = error instanceof Error ? error.message : String(error || "অজানা ত্রুটি");

    let userFriendlyMsg = message;
    if (/503|UNAVAILABLE|high demand|overloaded|spikes in demand/i.test(message)) {
      userFriendlyMsg =
        "Google Gemini সার্ভারে এই মুহূর্তে সাময়িক অতিরিক্ত চাপ (High Demand/503)। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার 'পুনরায় চেষ্টা' বাটনে ক্লিক করুন অথবা সেটিংস থেকে অন্য মডেল (যেমন Gemini 2.5 Flash) নির্বাচন করুন।";
    } else if (/API key not valid|API_KEY_INVALID|key.*invalid|401|403/i.test(message)) {
      userFriendlyMsg = "API key সঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে। সেটিংস থেকে সঠিক key দিন।";
    } else if (/quota|429|rate ?limit|resource.*exhausted/i.test(message)) {
      userFriendlyMsg = "API কোটা বা রেট লিমিট শেষ হয়ে গেছে। অনুগ্রহ করে ১-২ মিনিট পর আবার চেষ্টা করুন।";
    } else if (/payload.*too large|exceeded/i.test(message)) {
      userFriendlyMsg = "ফাইলের আকার অনেক বড়। অনুগ্রহ করে পেজ সিলেক্টর দিয়ে নির্দিষ্ট কিছু পাতা নির্বাচন করুন।";
    }

    return NextResponse.json({ error: userFriendlyMsg }, { status: 500 });
  }
}
