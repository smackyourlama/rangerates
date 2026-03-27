import { NextResponse } from "next/server";
import { buildDeliveryQuote } from "@/lib/distance";
import { DeliveryRequestPayload } from "@/types/delivery";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DeliveryRequestPayload;
    const address = payload?.address?.trim();

    if (!address) {
      return NextResponse.json(
        { error: "Please enter a delivery address." },
        { status: 400 }
      );
    }

    const quote = await buildDeliveryQuote(address);

    return NextResponse.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error("Quote calculation failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to calculate delivery fee right now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
