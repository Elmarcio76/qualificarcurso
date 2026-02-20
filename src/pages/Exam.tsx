import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const MAX_ATTEMPTS = 3;

const Exam = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [examResult, setExamResult] = useState<{ correct: number; total: number; attempt: number; remaining_attempts: number } | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !user) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch previous attempts
      const { data: results } = await supabase
        .from("exam_results")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .order("completed_at", { ascending: true });

      if (results) setPreviousAttempts(results);

      // Fetch questions from secure view
      const { data: q } = await supabase
        .from("exam_questions_public" as any)
        .select("*")
        .eq("course_id", courseId)
        .order("questaonum");

      if (q) setQuestions(q);
      setLoading(false);
    };

    fetchData();
  }, [courseId, user]);

  const passed = previousAttempts.some((a) => a.score >= 7);
  const attemptsUsed = previousAttempts.length;
  const canRetake = !passed && attemptsUsed < MAX_ATTEMPTS && !submitted;
  const lastScore = previousAttempts.length > 0 ? previousAttempts[previousAttempts.length - 1].score : null;

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast({ title: "Responda todas as questões", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-exam", {
        body: { answers, course_id: courseId },
      });

      if (error) {
        toast({ title: "Erro ao enviar prova", description: "Tente novamente.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      setScore(data.score);
      setExamResult({ correct: data.correct, total: data.total, attempt: data.attempt, remaining_attempts: data.remaining_attempts });
      setSubmitted(true);

      if (data.score >= 7) {
        toast({ title: "Parabéns! Você foi aprovado!", description: `Nota: ${data.score.toFixed(1)} (${data.correct}/${data.total} acertos)` });
      } else {
        const remainMsg = data.remaining_attempts > 0
          ? `Você ainda tem ${data.remaining_attempts} tentativa(s).`
          : "Você esgotou suas tentativas.";
        toast({ title: "Não atingiu a nota mínima", description: `Nota: ${data.score.toFixed(1)}. ${remainMsg}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao enviar prova", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSubmitted(false);
    setScore(null);
    setExamResult(null);
    setAnswers({});
    // Update previous attempts with the new one
    if (examResult) {
      setPreviousAttempts((prev) => [...prev, { score: score!, completed_at: new Date().toISOString() }]);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  // Already passed
  if (passed && !submitted) {
    const passingScore = previousAttempts.find((a) => a.score >= 7)!.score;
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-xl font-bold mb-2">Prova já realizada - Aprovado!</p>
              <p className="text-lg">
                Sua nota: <span className="text-green-600">{passingScore.toFixed(1)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tentativa(s) utilizada(s): {attemptsUsed} de {MAX_ATTEMPTS}
              </p>
              <Button className="mt-4" onClick={() => navigate(`/certificate/${courseId}`)}>
                Ver Certificado
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // All attempts used and not passed
  if (attemptsUsed >= MAX_ATTEMPTS && !passed && !submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-xl font-bold mb-2 text-destructive">Tentativas esgotadas</p>
              <p className="text-lg">
                Última nota: <span className="text-destructive">{lastScore?.toFixed(1)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Você utilizou todas as {MAX_ATTEMPTS} tentativas sem atingir a nota mínima 7.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Prova - 10 Questões</h1>
          </div>
          {attemptsUsed > 0 && !submitted && (
            <span className="text-sm text-muted-foreground">
              Tentativa {attemptsUsed + 1} de {MAX_ATTEMPTS}
            </span>
          )}
        </div>

        {questions.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma questão disponível.</p>
        ) : submitted ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold mb-2">Resultado</p>
              <p
                className="text-4xl font-bold mb-2"
                style={{ color: score! >= 7 ? "hsl(var(--auth-gradient-end))" : "hsl(var(--destructive))" }}
              >
                {score!.toFixed(1)}
              </p>
              {examResult && (
                <>
                  <p className="text-muted-foreground mb-2">
                    {examResult.correct} de {examResult.total} acertos
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tentativa {examResult.attempt} de {MAX_ATTEMPTS}
                  </p>
                </>
              )}
              {score! >= 7 ? (
                <>
                  <p className="mb-4">Aprovado! Seu certificado está disponível.</p>
                  <Button onClick={() => navigate(`/certificate/${courseId}`)}>Ver Certificado</Button>
                </>
              ) : examResult && examResult.remaining_attempts > 0 ? (
                <>
                  <p className="mb-4">
                    Reprovado. Nota mínima: 7. Você tem mais {examResult.remaining_attempts} tentativa(s).
                  </p>
                  <Button onClick={handleRetake}>Tentar Novamente</Button>
                </>
              ) : (
                <p className="text-destructive">Reprovado. Você esgotou suas {MAX_ATTEMPTS} tentativas.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => {
              const options = [
                { num: 1, text: q.opcao1 },
                { num: 2, text: q.opcao2 },
                { num: 3, text: q.opcao3 },
                { num: 4, text: q.opcao4 },
                { num: 5, text: q.opcao5 },
              ];
              return (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {q.questaonum}. {q.proposicaoquestao}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {options.map((opt) => (
                        <label
                          key={opt.num}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            answers[q.id] === opt.num ? "border-primary bg-primary/5" : "hover:bg-accent"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.num}
                            checked={answers[q.id] === opt.num}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.num }))}
                            className="accent-primary"
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar Prova"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Exam;
