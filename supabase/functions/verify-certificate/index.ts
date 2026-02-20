import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { certificate_number } = await req.json();
    if (!certificate_number?.trim()) {
      return new Response(JSON.stringify({ error: "Número do certificado é obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: cert } = await supabaseAdmin
      .from("certificates")
      .select("*, courses(title, workload)")
      .eq("certificate_number", certificate_number.trim())
      .maybeSingle();

    if (!cert) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, cpf")
      .eq("user_id", cert.user_id)
      .maybeSingle();

    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("enrolled_at")
      .eq("user_id", cert.user_id)
      .eq("course_id", cert.course_id)
      .maybeSingle();

    const { data: examResults } = await supabaseAdmin
      .from("exam_results")
      .select("score, completed_at")
      .eq("user_id", cert.user_id)
      .eq("course_id", cert.course_id)
      .gte("score", 7)
      .order("completed_at", { ascending: false })
      .limit(1);

    const examResult = examResults?.[0] ?? null;

    // Mask CPF: show only last 4 digits
    const cpfMasked = profile?.cpf
      ? `***.***.*${profile.cpf.slice(-4, -2)}-${profile.cpf.slice(-2)}`
      : null;

    return new Response(JSON.stringify({
      found: true,
      certificate_number: cert.certificate_number,
      generated_at: cert.generated_at,
      course: cert.courses,
      student_name: profile?.name ?? null,
      cpf: cpfMasked,
      enrolled_at: enrollment?.enrolled_at ?? null,
      exam_score: examResult?.score ?? null,
      exam_date: examResult?.completed_at ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("verify-certificate error:", error.message);
    return new Response(JSON.stringify({ error: "Erro ao verificar certificado" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
