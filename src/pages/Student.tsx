import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Play, Award, CheckCircle, BookOpen, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Student = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [examResults, setExamResults] = useState<any[]>([]);
  const [confirmCourse, setConfirmCourse] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: enr } = await supabase.from("enrollments").select("*, courses(*)").eq("user_id", user.id);
      if (enr) {
        setEnrollments(enr);
        setEnrolledCourseIds(new Set(enr.map((e: any) => e.course_id)));
      }
      const { data: all } = await supabase.from("courses").select("*").eq("active", true);
      if (all) setCourses(all);
      const { data: results } = await supabase.from("exam_results").select("*").eq("user_id", user.id);
      if (results) setExamResults(results);
    };
    fetchData();
  }, [user]);

  if (loading) return null;

  const recommended = courses.filter((c) => !enrolledCourseIds.has(c.id));
  const hasPassedExam = (courseId: string) => examResults.some((r) => r.course_id === courseId && r.score >= 7);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Área do Aluno</h1>
        </div>
        <Tabs defaultValue="enrolled">
          <TabsList className="mb-6">
            <TabsTrigger value="enrolled">Meus Cursos ({enrollments.length})</TabsTrigger>
            <TabsTrigger value="recommended">Relação de Cursos ({courses.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="enrolled">
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground">Você ainda não está matriculado em nenhum curso.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enrollments.map((e: any) => {
                  const passed = hasPassedExam(e.course_id);
                  const examAvailable = new Date(e.exam_available_after) <= new Date();
                  return (
                    <Card key={e.id} className={passed ? "border-primary/40" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{e.courses?.title}</CardTitle>
                          {passed && (
                            <Badge className="shrink-0 bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Concluído
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Matriculado em: {new Date(e.enrolled_at).toLocaleDateString("pt-BR")}</p>
                        {!passed && (
                          <p className="text-sm text-muted-foreground">
                            Prova disponível: {examAvailable ? "✅ Sim" : `📅 Liberação em ${new Date(e.exam_available_after).toLocaleDateString("pt-BR")} (20 dias após matrícula)`}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/course/${e.course_id}`)}>
                          <BookOpen className="mr-1 h-4 w-4" /> Acessar
                        </Button>
                        {passed ? (
                          <Button size="sm" onClick={() => navigate(`/certificate/${e.course_id}`)}>
                            <Award className="mr-1 h-4 w-4" /> Certificado
                          </Button>
                        ) : examAvailable && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/exam/${e.course_id}`)}>
                            <Play className="mr-1 h-4 w-4" /> Fazer Prova
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="recommended">
            {courses.length === 0 ? (
              <p className="text-muted-foreground">Nenhum curso disponível no momento.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => (
                  <Card key={c.id}>
                    <CardHeader><CardTitle className="text-lg">{c.title}</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{c.short_description}</p>
                      <p className="mt-2 font-bold text-primary">R$ {Number(c.price).toFixed(2)}</p>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/course/${c.id}`)}>Ver curso</Button>
                      {enrolledCourseIds.has(c.id) ? (
                        <Button size="sm" variant="secondary" disabled className="opacity-80">
                          <CheckCircle className="mr-1 h-4 w-4" /> Já Matriculado
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setConfirmCourse(c)}>
                          <ShoppingCart className="mr-1 h-4 w-4" /> Adicionar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!confirmCourse} onOpenChange={(open) => !open && setConfirmCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adicionar ao carrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja adicionar <strong>{confirmCourse?.title}</strong> ao carrinho?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              addItem({ id: confirmCourse.id, title: confirmCourse.title, price: Number(confirmCourse.price), stripe_price_id: confirmCourse.stripe_price_id });
              toast({ title: "Curso adicionado ao carrinho!" });
              setConfirmCourse(null);
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Student;
