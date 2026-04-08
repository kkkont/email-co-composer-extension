import { NextRequest, NextResponse } from "next/server";
import { generateEmail } from "@/lib/azure-api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      goal,
      mainMessage,
      recipientContext,
      tone,
      length,
      urgency,
      extraNotes,
    } = body;

    if (!mainMessage) {
      return NextResponse.json(
        { error: "mainMessage is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const email = await generateEmail({
      goal: goal ?? "",
      mainMessage,
      recipientContext: recipientContext ?? "",
      tone: tone ?? 0.5,
      length: length ?? 0.5,
      urgency: urgency ?? false,
      extraNotes: extraNotes ?? "",
      language: body.language ?? "en",
    });

    return NextResponse.json({ email }, { headers: corsHeaders });
  } catch (error) {
    console.error("Email generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500, headers: corsHeaders },
    );
  }
}
