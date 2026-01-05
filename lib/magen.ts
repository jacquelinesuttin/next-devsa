const MAGEN_API_URL = process.env.MAGEN_API_URL || 'https://axdupochainmbxtfyflq.supabase.co/functions/v1';
const MAGEN_API_KEY = process.env.MAGEN_API_KEY;

export const MAGEN_THRESHOLDS = {
  formSubmission: 0.7,
};

interface MagenVerificationResult {
  valid: boolean;
  humanScore?: number;
  classification?: 'HUMAN' | 'BOT' | 'SUSPECT';
  sessionId?: string;
  error?: string;
}

export async function checkVerification(sessionId: string): Promise<MagenVerificationResult> {
  if (!MAGEN_API_KEY) {
    return { valid: false, error: 'MAGEN_API_KEY not configured' };
  }

  try {
    // Use GET /magen-verify-session/:sessionId to check status
    const response = await fetch(`${MAGEN_API_URL}/magen-verify-session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAGEN_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { valid: false, error: error.error?.message || `HTTP ${response.status}` };
    }

    const data = await response.json();

    // API returns: { success: true, data: { status, trustScore, ... } }
    if (!data.success || !data.data) {
      return { valid: false, error: 'Invalid API response' };
    }

    const sessionData = data.data;

    return {
      valid: sessionData.status === 'verified',
      humanScore: sessionData.trustScore, // API returns trustScore (0.0-1.0)
      classification: sessionData.trustScore >= 0.9 ? 'HUMAN' : 
                     sessionData.trustScore >= 0.7 ? 'HUMAN' : 
                     sessionData.trustScore >= 0.5 ? 'SUSPECT' : 'BOT',
      sessionId: sessionData.sessionId,
      error: sessionData.status === 'failed' ? 'Verification failed' : 
            sessionData.status === 'expired' ? 'Session expired' : undefined,
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
