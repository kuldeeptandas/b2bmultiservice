import { NextResponse } from "next/server";

export interface OfferBanner {
  badge: string;
  title: string;
  subtitle: string;
  code: string;
  tag: string;
  imageUrl: string;
  buttonText: string;
  active: boolean;
  theme: "green" | "blue" | "purple" | "amber";
}

export const defaultOfferBanner: OfferBanner = {
  badge: "🎉 SPECIAL FESTIVAL OFFER",
  title: "Save Flat ₹500 + Up to 20% Off on Comprehensive Insurance",
  subtitle: "RTO-approved digital policy certificate delivered in 2 minutes. Free roadside assistance included!",
  code: "SAVE20",
  tag: "⚡ 1:1 Instant Wallet Points",
  imageUrl: "",
  buttonText: "Claim Offer / Apply Policy →",
  active: true,
  theme: "green",
};

const CLOUD_BANNER_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1cecd59c7128f";

declare global {
  // eslint-disable-next-line no-var
  var __shielddrive_banner: OfferBanner | undefined;
}

export const dynamic = "force-dynamic";

export async function GET() {
  let banner = globalThis.__shielddrive_banner;

  // Retrieve persistent banner from cloud
  try {
    const res = await fetch(CLOUD_BANNER_URL, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && typeof json.data === "object" && json.data.theme) {
        banner = json.data as OfferBanner;
        globalThis.__shielddrive_banner = banner;
      }
    }
  } catch (err) {
    console.warn("Banner cloud fetch fallback:", err);
  }

  if (!banner) {
    banner = defaultOfferBanner;
  }

  return NextResponse.json(
    { success: true, banner },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const banner = body.banner;
    if (!banner) {
      return NextResponse.json({ success: false, error: "Missing banner data" }, { status: 400 });
    }

    globalThis.__shielddrive_banner = banner;

    // Persist to cloud store so all devices & serverless instances see it
    try {
      await fetch(CLOUD_BANNER_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "shielddrive_banner_v1",
          data: banner,
        }),
      });
    } catch (cErr) {
      console.warn("Cloud banner save error:", cErr);
    }

    return NextResponse.json(
      { success: true, banner },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
