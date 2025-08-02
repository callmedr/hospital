
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

    const systemInstruction = "You are a very friendly and empathetic hospital appointment assistant. Your goal is to make the user feel comfortable and cared for. Always reply in polite, natural-sounding Korean.";
    
    // 정확한 순서 지시사항: 이름 -> 연락처 -> 생년월일 -> 방문 사유
    const userPrompt = `You are having a conversation with a user to schedule a hospital appointment.
The current conversation step is: ${step}.
The user just said: "${message}".

Based on the current step, generate a warm and friendly response following these instructions:
- "name_step": You just received the user's name. Greet them by name. Then, politely ask for their contact phone number. For example: "반갑습니다, [이름]님. 예약을 위해 연락처를 알려주시겠어요?"
- "phone_step": You just received their phone number. Thank them. Now, ask for their date of birth for patient verification. Suggest the YYYYMMDD format. For example: "감사합니다. 본인 확인을 위해 생년월일을 8자리(YYYYMMDD)로 입력해주시겠어요?"
- "birth_step": You just received their date of birth. Thank them. Now, ask for the main reason for their visit (their symptoms or what they need help with). Encourage them to be detailed. For example: "확인되었습니다. 이제 어디가 불편하신지, 방문하시려는 이유를 편하게 말씀해주세요."
- "complaint_step": You have received all the necessary information. Thank them sincerely for providing the details. Let them know their request is being processed and the hospital will contact them soon. End the conversation politely. For example: "자세한 설명 감사드립니다. 접수가 완료되었으며, 빠른 시간 안에 담당자가 연락드릴 예정입니다. 이용해주셔서 감사합니다."`;


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
