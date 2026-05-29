import { NextRequest, NextResponse } from "next/server";
import type { Contact, ResumeData } from "@/types";
import { computeFitScore } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contact, resume } = body as { contact: Contact; resume: ResumeData | null };

    const userSchool = resume?.education?.[0]?.institution || "";
    const targetSectors = resume?.targetSectors || [];

    const score = computeFitScore(contact, userSchool, targetSectors);

    const factors: string[] = [];
    if (
      contact.school.toLowerCase().includes(userSchool.toLowerCase()) ||
      contact.undergrad?.toLowerCase().includes(userSchool.toLowerCase())
    ) {
      factors.push("Strong school match (+30)");
    }
    if (
      targetSectors.some((s) =>
        contact.coverageSectors.some((cs) =>
          cs.toLowerCase().includes(s.toLowerCase())
        )
      )
    ) {
      factors.push("Sector alignment (+15)");
    }
    if (contact.seniority === "analyst" || contact.seniority === "associate") {
      factors.push("Junior seniority — more accessible (+5)");
    }
    if (contact.priority === "high") {
      factors.push("High priority firm (+5)");
    }

    return NextResponse.json({ score, factors });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
