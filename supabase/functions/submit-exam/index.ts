import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { answers, course_id } = await req.json();

    if (!course_id || !answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check enrollment
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .maybeSingle();

    if (!enrollment) {
      return new Response(JSON.stringify({ error: "Não matriculado neste curso" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(enrollment.exam_available_after) > new Date()) {
      return new Response(JSON.stringify({ error: "Prova ainda não disponível" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check previous attempts
    const { data: previousAttempts } = await supabaseAdmin
      .from("exam_results")
      .select("id, score")
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .order("completed_at", { ascending: true });

    const attempts = previousAttempts || [];
    const passed = attempts.some((a: any) => a.score >= 7);

    if (passed) {
      return new Response(JSON.stringify({ error: "Você já foi aprovado nesta prova", score: attempts.find((a: any) => a.score >= 7)!.score }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (attempts.length >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ error: `Você já utilizou todas as ${MAX_ATTEMPTS} tentativas`, attempts: attempts.length }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch questions with correct answers (server-side only)
    const { data: questions } = await supabaseAdmin
      .from("exam_questions")
      .select("id, opcao_correta")
      .eq("course_id", course_id);

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma questão encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate score SERVER-SIDE
    let correct = 0;
    questions.forEach((q: any) => {
      if (Number(answers[q.id]) === q.opcao_correta) correct++;
    });
    const score = (correct / questions.length) * 10;
    const attemptNumber = attempts.length + 1;

    // Insert result
    await supabaseAdmin.from("exam_results").insert({
      user_id: user.id,
      course_id,
      score,
      answers,
    });

    // Generate certificate if passed
    if (score >= 7) {
      // Generate unique certificate number (6-8 digits)
      const { data: certNum } = await supabaseAdmin.rpc("generate_certificate_number" as any);
      await supabaseAdmin.from("certificates").insert({
        user_id: user.id,
        course_id,
        certificate_number: certNum,
      } as any);
    }

    return new Response(JSON.stringify({
      score,
      total: questions.length,
      correct,
      attempt: attemptNumber,
      max_attempts: MAX_ATTEMPTS,
      remaining_attempts: MAX_ATTEMPTS - attemptNumber,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-exam error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
