import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const customKey = req.headers.get("x-gemini-key") || req.nextUrl.searchParams.get("key");
    const activeKey = customKey?.trim() || process.env.GEMINI_API_KEY;

    const hasServerKey = Boolean(process.env.GEMINI_API_KEY);

    // Default curated model list based on latest Google GenAI models
    const fallbackModels = [
      { name: "gemini-3.8-flash", displayName: "Gemini 3.8 Flash (ডিফল্ট, উচ্চ গতি ও নির্ভরযোগ্য)" },
      { name: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash (স্থিতিশীল)" },
      { name: "gemini-3.1-pro-preview", displayName: "Gemini 3.1 Pro Preview (গভীর বিশ্লেষণ)" },
      { name: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
    ];

    if (!activeKey) {
      return NextResponse.json({
        hasKey: false,
        hasServerKey: false,
        models: fallbackModels,
      });
    }

    try {
      // Try fetching live models list from Google Generative Language API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(activeKey)}`,
        { cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        const apiModels = (data.models || [])
          .filter((m: { name?: string; supportedGenerationMethods?: string[] }) =>
            String(m.name || "").includes("gemini")
          )
          .filter((m: { supportedGenerationMethods?: string[] }) =>
            (m.supportedGenerationMethods || []).includes("generateContent")
          )
          .filter((m: { name?: string }) => !/embedding|image|audio|transcribe|live|tts|realtime/i.test(m.name || ""))
          .map((m: { name?: string; displayName?: string }) => {
            const cleanName = String(m.name || "").replace(/^models\//, "");
            return {
              name: cleanName,
              displayName: m.displayName ? `${m.displayName} (${cleanName})` : cleanName,
            };
          });

        if (apiModels.length > 0) {
          return NextResponse.json({
            hasKey: true,
            hasServerKey,
            models: apiModels,
          });
        }
      }
    } catch {
      // Fall through to fallback list
    }

    return NextResponse.json({
      hasKey: true,
      hasServerKey,
      models: fallbackModels,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
