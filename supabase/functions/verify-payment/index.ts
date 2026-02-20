import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const authenticatedUserId = authData.user.id;

    // 2. Get session_id from body
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id necessário");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Pagamento não confirmado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 3. Verify the authenticated user matches the payment metadata
    const userId = session.metadata?.user_id;
    const courseIds = session.metadata?.course_ids?.split(",") || [];

    if (!userId || courseIds.length === 0) throw new Error("Metadados inválidos");

    if (userId !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Não autorizado para este pagamento" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 4. Check if this session was already processed
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("stripe_session_id", session_id)
      .limit(1);

    if (existingPayment && existingPayment.length > 0) {
      return new Response(JSON.stringify({ success: true, message: "Pagamento já processado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Create enrollments and payments using service role
    for (const courseId of courseIds) {
      await supabaseAdmin.from("enrollments").upsert({
        user_id: userId,
        course_id: courseId,
      }, { onConflict: "user_id,course_id" });

      await supabaseAdmin.from("payments").insert({
        user_id: userId,
        course_id: courseId,
        amount: (session.amount_total || 0) / 100,
        status: "paid",
        stripe_session_id: session_id,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("verify-payment error:", error.message);
    return new Response(JSON.stringify({ error: "Erro ao verificar o pagamento. Tente novamente." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
