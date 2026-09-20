import { Type } from "@google/genai";

export const MIND_MAP_SCHEMA = {
  type: Type.OBJECT,
  description: "সময়ক্রম-ভিত্তিক মাইন্ড ম্যাপ (Chronological Mind Map)",
  properties: {
    rootLabel: {
      type: Type.STRING,
      description: "কেন্দ্রীয় বিষয় বা ব্যক্তির নাম — খুব সহজ ও স্বাভাবিক বাংলায় (যেমন: 'বাংলাদেশের মুক্তিযুদ্ধ', 'কৃত্রিম বুদ্ধিমত্তার ইতিহাস')",
    },
    nodes: {
      type: Type.ARRAY,
      description: "মাইন্ড ম্যাপের সব নোড — রুট, তারিখ-হাব ও শাখা",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "ইউনিক আইডি, যেমন n1, n2" },
          label: {
            type: Type.STRING,
            description: "৩-৭ শব্দের মধ্যে অত্যন্ত সহজবোধ্য ও মানুষের মতো স্বাভাবিক বাংলা লেবেল। কোনো রোবোটিক বা কঠিন সাধু/ভারী শব্দ নয়।",
          },
          type: {
            type: Type.STRING,
            enum: ["root", "date", "event", "person", "place", "decision", "document", "outcome", "subnode"],
            description: "নোডের ধরন",
          },
          date: {
            type: Type.STRING,
            description: "সাল বা তারিখ, খুব স্বাভাবিক বাংলায় (যেমন: '১৯৪৭ সাল', '২১ ফেব্রুয়ারি ১৯৫২')",
          },
          detail: {
            type: Type.STRING,
            description: "১-২ বাক্যে অত্যন্ত সহজ, প্রাঞ্জল ও মানুষের মতো বোধগম্য সারসংক্ষেপ।",
          },
          sourceContext: {
            type: Type.STRING,
            description: "মূল সোর্স ডকুমেন্টের আলোকে এই নোডটির বিস্তারিত পটভূমি, প্রেক্ষাপট, কারণ, ঘটনা ও পূর্ণ তাৎপর্য (৩-৫ বাক্য) — মানুষের মতো সহজ ও প্রাঞ্জল ভাষায়। এটি নোড তৈরির সময়ই সংযুক্ত থাকবে যাতে নোড প্রসারিত (expand) করলেই সাথে সাথে পড়া যায়।",
          },
          extraDetails: {
            type: Type.ARRAY,
            description: "এই নোডের সাথে সংশ্লিষ্ট ১-৩টি বাড়তি তথ্য, সূক্ষ্ম উপাত্ত, সংখ্যা, উক্তি বা পার্শ্ব-তথ্য যা মূল নোডের সাথে তুলনামূলক ছোট নোড বক্সে সংযুক্ত থাকবে যাতে কোনো ছোটখাটো তথ্যও বাদ না পড়ে।",
            items: {
              type: Type.STRING,
              description: "সুনির্দিষ্ট ও ছোট তথ্যকণিকা (যেমন: 'ভাষণের দৈর্ঘ্য: ১৮ মিনিট', 'মোট আসন সংখ্যা: ৩১৩টি')",
            },
          },
        },
        required: ["id", "label", "type", "detail", "sourceContext"],
      },
    },
    edges: {
      type: Type.ARRAY,
      description: "নোডগুলোর মধ্যে সম্পর্ক ও কারণ — রুট→তারিখ→শাখা এবং ক্রস-লিংক",
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "উৎস নোডের আইডি" },
          target: { type: Type.STRING, description: "গন্তব্য নোডের আইডি" },
          label: {
            type: Type.STRING,
            description: "সংযোগের কারণ মানুষের সহজ মুখের ভাষায় (যেমন: 'যার ফলে', 'এর প্রতিবাদে', 'নেতৃত্বে ছিলেন', 'ঘটনাস্থল', 'পরবর্তী পদক্ষেপ')",
          },
        },
        required: ["source", "target"],
      },
    },
  },
  required: ["rootLabel", "nodes", "edges"],
};
