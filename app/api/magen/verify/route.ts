import { NextRequest, NextResponse } from 'next/server';
import { checkVerification } from '@/lib/magen';

interface EntropyConfig {
  enabled: boolean;
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  target?: 'mouse' | 'keyboard' | 'touch' | 'all';
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;

  try {
    const body = await request.json();
    sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await checkVerification(sessionId);

    // Generate entropy config based on verification result
    const entropyConfig: EntropyConfig = {
      enabled: true,
      intensity: result.valid && (result.humanScore || 0) >= 0.7 ? 'medium' : 'high',
      duration: result.valid && (result.humanScore || 0) >= 0.7 ? 30000 : 60000,
      target: result.valid && (result.humanScore || 0) >= 0.7 ? 'mouse' : 'all',
      sessionId,
    };

    if (!result.valid) {
      // Still return entropy config even on failure for entropy flooding
      return NextResponse.json(
        {
          error: result.error || 'Verification failed',
          humanScore: result.humanScore || 0.0,
          entropyConfig,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      humanScore: result.humanScore,
      classification: result.classification,
      entropyConfig,
    });
  } catch (error) {
    console.error('Magen verify error:', error);

    return NextResponse.json(
      {
        error: 'Verification failed',
        humanScore: 0.0,
        entropyConfig: {
          enabled: true,
          intensity: 'high',
          duration: 60000,
          target: 'all',
          sessionId,
        },
      },
      { status: 500 }
    );
  }
}
