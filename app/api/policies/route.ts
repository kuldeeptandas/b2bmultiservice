import { NextResponse } from "next/server";
import { CustomerPolicy, initialMasterPolicies } from "@/lib/policyStore";

const CLOUD_POLICIES_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1cecd5ae71290";

// Keep documents intact for recent policies so admin sees original uploaded files
function sanitizePolicy(p: CustomerPolicy, index: number): CustomerPolicy {
  // Keep original doc URLs for latest 15 policies
  if (index < 15) {
    return p;
  }
  // Strip for older ones to avoid hitting external API payload limits
  return {
    ...p,
    rcDataUrl: undefined,
    panDataUrl: undefined,
    aadharDataUrl: undefined,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __shielddrive_policies: CustomerPolicy[] | undefined;
}

if (!globalThis.__shielddrive_policies) {
  globalThis.__shielddrive_policies = [...initialMasterPolicies];
}

export const dynamic = "force-dynamic";

export async function GET() {
  let policies = globalThis.__shielddrive_policies;

  // Retrieve latest from cloud
  try {
    const res = await fetch(CLOUD_POLICIES_URL, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.list && Array.isArray(json.data.list) && json.data.list.length > 0) {
        // Merge cloud policies with initial policies
        const map = new Map<string, CustomerPolicy>();
        initialMasterPolicies.forEach((p) => map.set(p.id, p));
        json.data.list.forEach((p: CustomerPolicy) => map.set(p.id, p));
        policies = Array.from(map.values());
        globalThis.__shielddrive_policies = policies;
      }
    }
  } catch (err) {
    console.warn("Cloud policies fetch fallback:", err);
  }

  if (!policies) {
    policies = [...initialMasterPolicies];
  }

  return NextResponse.json(
    { success: true, policies },
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
    const newPolicy: CustomerPolicy = body.policy;

    if (!newPolicy || !newPolicy.id) {
      return NextResponse.json({ success: false, error: "Invalid policy data" }, { status: 400 });
    }

    const current = globalThis.__shielddrive_policies || [...initialMasterPolicies];
    const existingIndex = current.findIndex((p) => p.id === newPolicy.id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...newPolicy };
    } else {
      current.unshift(newPolicy);
    }

    globalThis.__shielddrive_policies = current;

    // Persist to cloud store
    try {
      const lightweight = current.slice(0, 50).map((p, idx) => sanitizePolicy(p, idx));
      await fetch(CLOUD_POLICIES_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "shielddrive_policies_v1",
          data: { list: lightweight },
        }),
      });
    } catch (cErr) {
      console.warn("Could not save policies to cloud store:", cErr);
    }

    return NextResponse.json({ success: true, policy: newPolicy, total: current.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updatedPolicy: CustomerPolicy = body.policy;

    if (!updatedPolicy || !updatedPolicy.id) {
      return NextResponse.json({ success: false, error: "Invalid policy" }, { status: 400 });
    }

    const current = globalThis.__shielddrive_policies || [...initialMasterPolicies];
    const index = current.findIndex((p) => p.id === updatedPolicy.id);

    if (index >= 0) {
      current[index] = { ...current[index], ...updatedPolicy };
    } else {
      current.unshift(updatedPolicy);
    }

    globalThis.__shielddrive_policies = current;

    // Persist to cloud store
    try {
      const lightweight = current.slice(0, 50).map((p, idx) => sanitizePolicy(p, idx));
      await fetch(CLOUD_POLICIES_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "shielddrive_policies_v1",
          data: { list: lightweight },
        }),
      });
    } catch (cErr) {
      console.warn("Could not save policies to cloud store:", cErr);
    }

    return NextResponse.json({ success: true, policy: updatedPolicy });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
