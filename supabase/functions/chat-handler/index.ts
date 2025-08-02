
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai';

// By declaring Deno as any, we can silence TypeScript errors about the Deno
// global not being found in environments that aren't configured for Deno.
// The Supabase Edge Function runtime provides the Deno global.
declare const Deno: any;

// --- CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Main Handler ---
serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Get and Verify Environment Variables ---
    console.log("Function invoked. Verifying environment variables...");
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("CRITICAL: One or more environment variables are missing.");
      throw new Error("Server configuration error: Required environment variables (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.");
    }
    console.log("Environment variables verified successfully.");

    // --- 2. Parse Request Body ---
    const body = await req.json();
    const { message, sessionId, step, userData } = body;
    console.log(`Received request for session ${sessionId} at step ${step}.`);

    if (!message || !sessionId || !step || !userData) {
      throw new Error("Invalid request: Missing 'message', 'sessionId', 'step', or 'userData'.");
    }

    // --- 3. Call Gemini API using @google/genai SDK ---
    console.log("Constructing prompt and calling Gemini API...");
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const systemInstruction = "You are a friendly hospital appointment assistant. Always reply in Korean.";
    // 정확한 순서 지시사항: 이름 -> 연락처 -> 생년월일 -> 방문 사유
    const userPrompt = `Current step: ${step}
User's message: "${message}"

Your instructions per step:
- "name_step": You received the user's name. Now, ask for a contact phone number.
- "phone_step": You received the phone number. Now, ask for their date of birth (e.g., 1990-01-01).
- "birth_step": You received the date of birth. Now, ask for the reason for their visit (chief complaint) in detail.
- "complaint_step": You received the reason for the visit. Thank them kindly and end the conversation by saying, "빠른 시간 안에 연락드리겠습니다."`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
        },
    });

    const botMessage = response.text;

    if (!botMessage) {
        console.error("Gemini response was empty. Full response object:", JSON.stringify(response, null, 2));
        throw new Error("Received an empty response from Gemini API.");
    }
    console.log("Successfully received and parsed Gemini response.");


    // --- 4. Update Database ---
    console.log("Initializing Supabase client and saving chat history...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: sessionData, error: selectError } = await supabase
      .from('chat_sessions')
      .select('chat_history')
      .eq('id', sessionId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // Ignore 'PGRST116' (row not found)
        console.error('Supabase select error:', selectError);
        throw selectError;
    }

    const existingHistory = sessionData?.chat_history || [];
    const newHistory = [...existingHistory, { user: message, bot: botMessage, timestamp: new Date().toISOString(), step }];

    const { error: upsertError } = await supabase.from('chat_sessions').upsert({
      id: sessionId,
      ...userData,
      chat_history: newHistory,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      throw upsertError;
    }
    console.log("Session data saved successfully.");

    // --- 5. Send Success Response ---
    return new Response(JSON.stringify({ response: botMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // --- Centralized Error Handling ---
    console.error('--- A critical error occurred in the Edge Function ---');
    console.error('Error Message:', error.message);
    return new Response(JSON.stringify({ error: `Edge Function failed: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
