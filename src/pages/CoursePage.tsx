import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Play, FileDown, ClipboardList, ArrowLeft } from "lucide-react";

const CoursePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("courses").select("*").eq("id", id).single().then(({ data }) => setCourse(data));
    if (user) {
      supabase.from("enrollments").select("*").eq("user_id", user.id).eq("course_id", id).maybeSingle().then(({ data }) => {
        setEnrollment(data);
        if (data) {
          supabase.from("course_videos").select("*").eq("course_id", id).order("order_index").then(({ data: v }) => setVideos(v || []));
          supabase.from("course_files").select("*").eq("course_id", id).then(({ data: f }) => setFiles(f || []));
        }
      });
    }
  }, [id, user]);

  if (!course) return <Layout><div className="container mx-auto px-4 py-8">Carregando...</div></Layout>;

  const examAvailable = enrollment && new Date(enrollment.exam_available_after) <= new Date();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{course.title}</h1>
        </div>
        <p className="text-muted-foreground mb-6">{course.workload && `Carga horária: ${course.workload}`}</p>
        <p className="text-foreground mb-6 whitespace-pre-wrap">{course.description}</p>

        {!enrollment ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">R$ {Number(course.price).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Adquira e comece a estudar agora</p>
              </div>
              {user ? (
                <Button onClick={() => addItem({ id: course.id, title: course.title, price: Number(course.price), stripe_price_id: course.stripe_price_id })}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Comprar
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>Entrar para comprar</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Videos */}
            <Card>
              <CardHeader><CardTitle>Aulas em Vídeo</CardTitle></CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum vídeo disponível ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {videos.map((v, i) => (
                      <a key={v.id} href={v.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                        <Play className="h-5 w-5 text-primary" />
                        <span>{i + 1}. {v.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files */}
            {files.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Material de Apoio</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {files.map((f) => (
                      <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                        <FileDown className="h-5 w-5 text-primary" />
                        <span>{f.title}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exam */}
            <Card>
              <CardContent className="p-6">
                {examAvailable ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Prova disponível!</p>
                      <p className="text-sm text-muted-foreground">10 questões de múltipla escolha. Nota mínima: 7</p>
                    </div>
                    <Button onClick={() => navigate(`/exam/${id}`)}>
                      <ClipboardList className="mr-2 h-4 w-4" /> Fazer Prova
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    A prova será liberada em {new Date(enrollment.exam_available_after).toLocaleDateString("pt-BR")} (20 dias após a matrícula).
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CoursePage;
