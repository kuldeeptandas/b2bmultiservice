import { NextResponse } from "next/server";

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  points: number;
  totalPolicies: number;
  totalVolume: number;
  joinedDate: string;
  status: "active" | "inactive";
  commission?: number;
}

const defaultAgents: Agent[] = [
  {
    id: "AGT-007",
    name: "Gurpreet Singh",
    phone: "+91 98140-55678",
    email: "gurpreet.agent@shielddrive.in",
    city: "Ludhiana, Punjab",
    points: 3220,
    totalPolicies: 3,
    totalVolume: 44700,
    joinedDate: "2024-08-15",
    status: "active",
    commission: 10,
  },
  {
    id: "AGT-008",
    name: "Harpreet Kaur",
    phone: "+91 98722-11432",
    email: "harpreet.k@shielddrive.in",
    city: "Amritsar, Punjab",
    points: 1850,
    totalPolicies: 2,
    totalVolume: 28400,
    joinedDate: "2024-10-01",
    status: "active",
    commission: 12,
  },
  {
    id: "AGT-009",
    name: "Manpreet Sharma",
    phone: "+91 94178-99001",
    email: "m.sharma@shielddrive.in",
    city: "Jalandhar, Punjab",
    points: 940,
    totalPolicies: 1,
    totalVolume: 14200,
    joinedDate: "2025-01-10",
    status: "active",
    commission: 10,
  },
  {
    id: "AGT-010",
    name: "Navjot Verma",
    phone: "+91 98555-43210",
    email: "navjot.v@shielddrive.in",
    city: "Bathinda, Punjab",
    points: 4200,
    totalPolicies: 4,
    totalVolume: 61800,
    joinedDate: "2024-06-20",
    status: "active",
    commission: 15,
  },
];

const CLOUD_AGENTS_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1cecd5bad1291";

declare global {
  // eslint-disable-next-line no-var
  var __shielddrive_agents: Agent[] | undefined;
}

if (!globalThis.__shielddrive_agents) {
  globalThis.__shielddrive_agents = [...defaultAgents];
}

export const dynamic = "force-dynamic";

export async function GET() {
  let agents = globalThis.__shielddrive_agents;

  // Retrieve latest from cloud
  try {
    const res = await fetch(CLOUD_AGENTS_URL, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.list && Array.isArray(json.data.list) && json.data.list.length > 0) {
        agents = json.data.list as Agent[];
        globalThis.__shielddrive_agents = agents;
      }
    }
  } catch (err) {
    console.warn("Cloud agents fetch fallback:", err);
  }

  if (!agents || agents.length === 0) {
    agents = [...defaultAgents];
  }

  return NextResponse.json(
    { success: true, agents },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const agents: Agent[] = body.agents;

    if (!Array.isArray(agents)) {
      return NextResponse.json({ success: false, error: "Invalid agents data" }, { status: 400 });
    }

    globalThis.__shielddrive_agents = agents;

    // Persist to cloud
    try {
      await fetch(CLOUD_AGENTS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "shielddrive_agents_v1",
          data: { list: agents },
        }),
      });
    } catch (cErr) {
      console.warn("Could not save agents to cloud:", cErr);
    }

    return NextResponse.json({ success: true, agents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

