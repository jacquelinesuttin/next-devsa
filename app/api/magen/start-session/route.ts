import { NextResponse } from 'next/server';

const MAGEN_BASE_URL = 'https://axdupochainmbxtfyflq.supabase.co/functions/v1';

// HARD-CODED FOR TESTING ONLY
const MAGEN_API_KEY =
  'magen_9f7c20e98e80bd0d850362ee4b67cb219c8f66c19f8ca580';

export async function POST() {
  try {
    const response = await fetch(
      `${MAGEN_BASE_URL}/magen-verify-start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Required by updated MAGEN API
          Authorization: `Bearer ${MAGEN_API_KEY}`,
        },
        body: JSON.stringify({
          action: 'speaker-submission',
          context: 'call-for-speakers',
          // userId optional but supported
          userId: 'devsa-test',
        }),
      }
    );

    const raw = await response.text();

    if (!response.ok) {
      console.error('MAGEN API error:', {
        status: response.status,
        body: raw,
      });

      return NextResponse.json(
        {
          sessionId: null,
          configured: true,
          ok: false,
          error: raw,
        },
        { status: 502 }
      );
    }

    let parsed: any = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = {};
    }

    const sessionId =
      parsed?.data?.sessionId ??
      parsed?.sessionId ??
      null;

    console.log('MAGEN session started:', sessionId);

    return NextResponse.json({
      sessionId,
      configured: true,
      ok: true,
    });
  } catch (error: any) {
    console.error('MAGEN start-session error:', error);

    return NextResponse.json(
      {
        sessionId: null,
        configured: true,
        ok: false,
        reason: error?.message ?? 'unknown_error',
      },
      { status: 500 }
    );
  }
}
