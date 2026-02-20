import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  // New course form
  const [newCourse, setNewCourse] = useState({ title: "", description: "", short_description: "", workload: "", price: "0", stripe_price_id: "" });
  // New coupon form
  const [newCoupon, setNewCoupon] = useState({ code: "", discount_percent: "", expires_at: "", max_uses: "" });
  // Video/file forms
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [newVideo, setNewVideo] = useState({ title: "", youtube_url: "" });
  const [newFile, setNewFile] = useState({ title: "", file_url: "" });
  // Exam question form
  const [newQuestion, setNewQuestion] = useState({ questaonum: "", proposicaoquestao: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", opcao5: "", opcao_correta: "" });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const { data: c } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (c) setCourses(c);
    const { data: e } = await supabase.from("enrollments").select("*, courses(title)").order("enrolled_at", { ascending: false });
    if (e) setEnrollments(e);
    
    // Fetch payments with course info
    const { data: pay } = await supabase.from("payments").select("*, courses(title)").order("created_at", { ascending: false });
    if (pay) {
      // Fetch all unique user_ids from payments to get profiles
      const userIds = [...new Set(pay.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, cpf").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setPayments(pay.map((p: any) => ({ ...p, profile: profileMap.get(p.user_id) || null })));
    }
    
    const { data: cp } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (cp) setCoupons(cp);
  };

  const createCourse = async () => {
    const { error } = await supabase.from("courses").insert({ ...newCourse, price: Number(newCourse.price) });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Curso criado!" });
    setNewCourse({ title: "", description: "", short_description: "", workload: "", price: "0", stripe_price_id: "" });
    fetchAll();
  };

  const deleteCourse = async (id: string) => {
    await supabase.from("courses").delete().eq("id", id);
    fetchAll();
  };

  const createCoupon = async () => {
    const { error } = await supabase.from("coupons").insert({
      code: newCoupon.code.toUpperCase(),
      discount_percent: Number(newCoupon.discount_percent),
      expires_at: newCoupon.expires_at || null,
      max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cupom criado!" });
    setNewCoupon({ code: "", discount_percent: "", expires_at: "", max_uses: "" });
    fetchAll();
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cupom excluído!" });
    fetchAll();
  };

  const addVideo = async () => {
    if (!selectedCourse) return;
    const { error } = await supabase.from("course_videos").insert({ course_id: selectedCourse, ...newVideo });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Vídeo adicionado!" });
    setNewVideo({ title: "", youtube_url: "" });
  };

  const addFile = async () => {
    if (!selectedCourse) return;
    const { error } = await supabase.from("course_files").insert({ course_id: selectedCourse, ...newFile });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Arquivo adicionado!" });
    setNewFile({ title: "", file_url: "" });
  };

  const addQuestion = async () => {
    if (!selectedCourse) return;
    const { error } = await supabase.from("exam_questions").insert({
      course_id: selectedCourse,
      questaonum: Number(newQuestion.questaonum),
      proposicaoquestao: newQuestion.proposicaoquestao,
      opcao1: newQuestion.opcao1,
      opcao2: newQuestion.opcao2,
      opcao3: newQuestion.opcao3,
      opcao4: newQuestion.opcao4,
      opcao5: newQuestion.opcao5,
      opcao_correta: Number(newQuestion.opcao_correta),
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Questão adicionada!" });
    setNewQuestion({ questaonum: "", proposicaoquestao: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", opcao5: "", opcao_correta: "" });
  };

  if (loading) return null;
  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        </div>
        <Tabs defaultValue="courses">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="enrollments">Matrículas</TabsTrigger>
          </TabsList>

          {/* COURSES */}
          <TabsContent value="courses">
            <Card className="mb-6">
              <CardHeader><CardTitle>Novo Curso</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Título" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
                <Input placeholder="Descrição curta" value={newCourse.short_description} onChange={(e) => setNewCourse({ ...newCourse, short_description: e.target.value })} />
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Descrição completa" rows={3} value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                <div className="flex gap-3">
                  <Input placeholder="Carga horária" value={newCourse.workload} onChange={(e) => setNewCourse({ ...newCourse, workload: e.target.value })} />
                  <Input placeholder="Preço" type="number" value={newCourse.price} onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })} />
                </div>
                <Input placeholder="Stripe Price ID (opcional)" value={newCourse.stripe_price_id} onChange={(e) => setNewCourse({ ...newCourse, stripe_price_id: e.target.value })} />
                <Button onClick={createCourse}><Plus className="mr-1 h-4 w-4" /> Criar Curso</Button>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {courses.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">R$ {Number(c.price).toFixed(2)} · {c.workload || "Sem carga horária"}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCourse(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CONTENT */}
          <TabsContent value="content">
            <Card className="mb-6">
              <CardHeader><CardTitle>Selecione o Curso</CardTitle></CardHeader>
              <CardContent>
                <select className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                  <option value="">Selecione...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </CardContent>
            </Card>
            {selectedCourse && (
              <>
                <Card className="mb-4">
                  <CardHeader><CardTitle className="text-base">Adicionar Vídeo</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Título do vídeo" value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} />
                    <Input placeholder="URL do YouTube" value={newVideo.youtube_url} onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })} />
                    <Button size="sm" onClick={addVideo}><Plus className="mr-1 h-4 w-4" /> Adicionar Vídeo</Button>
                  </CardContent>
                </Card>
                <Card className="mb-4">
                  <CardHeader><CardTitle className="text-base">Adicionar Arquivo</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Título do arquivo" value={newFile.title} onChange={(e) => setNewFile({ ...newFile, title: e.target.value })} />
                    <Input placeholder="URL do arquivo (PDF)" value={newFile.file_url} onChange={(e) => setNewFile({ ...newFile, file_url: e.target.value })} />
                    <Button size="sm" onClick={addFile}><Plus className="mr-1 h-4 w-4" /> Adicionar Arquivo</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Adicionar Questão da Prova (10 por curso)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Nº da questão (1-10)" type="number" min={1} max={10} value={newQuestion.questaonum} onChange={(e) => setNewQuestion({ ...newQuestion, questaonum: e.target.value })} />
                    <Input placeholder="Proposição da questão" value={newQuestion.proposicaoquestao} onChange={(e) => setNewQuestion({ ...newQuestion, proposicaoquestao: e.target.value })} />
                    <Input placeholder="Opção 1" value={newQuestion.opcao1} onChange={(e) => setNewQuestion({ ...newQuestion, opcao1: e.target.value })} />
                    <Input placeholder="Opção 2" value={newQuestion.opcao2} onChange={(e) => setNewQuestion({ ...newQuestion, opcao2: e.target.value })} />
                    <Input placeholder="Opção 3" value={newQuestion.opcao3} onChange={(e) => setNewQuestion({ ...newQuestion, opcao3: e.target.value })} />
                    <Input placeholder="Opção 4" value={newQuestion.opcao4} onChange={(e) => setNewQuestion({ ...newQuestion, opcao4: e.target.value })} />
                    <Input placeholder="Opção 5" value={newQuestion.opcao5} onChange={(e) => setNewQuestion({ ...newQuestion, opcao5: e.target.value })} />
                    <Input placeholder="Opção correta (1-5)" type="number" min={1} max={5} value={newQuestion.opcao_correta} onChange={(e) => setNewQuestion({ ...newQuestion, opcao_correta: e.target.value })} />
                    <Button size="sm" onClick={addQuestion}><Plus className="mr-1 h-4 w-4" /> Adicionar Questão</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* COUPONS */}
          <TabsContent value="coupons">
            <Card className="mb-6">
              <CardHeader><CardTitle>Novo Cupom</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="CÓDIGO" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} />
                <Input placeholder="% de desconto" type="number" value={newCoupon.discount_percent} onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })} />
                <Input placeholder="Limite de usos (vazio = ilimitado)" type="number" value={newCoupon.max_uses} onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })} />
                <Input type="datetime-local" value={newCoupon.expires_at} onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })} />
                <Button onClick={createCoupon}><Plus className="mr-1 h-4 w-4" /> Criar Cupom</Button>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {coupons.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.code} — {c.discount_percent}%</p>
                      <p className="text-sm text-muted-foreground">
                        {c.active ? "Ativo" : "Inativo"} · {c.max_uses ? `Usos: ${c.times_used}/${c.max_uses}` : `Usos: ${c.times_used} (ilimitado)`} · {c.expires_at ? `Expira: ${new Date(c.expires_at).toLocaleDateString("pt-BR")}` : "Sem expiração"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ENROLLMENTS */}
          <TabsContent value="enrollments">
            <Card className="mb-4">
              <CardHeader><CardTitle>Pagamentos e Matrículas</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum pagamento encontrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Data</th>
                          <th className="text-left py-2 px-2">Aluno</th>
                          <th className="text-left py-2 px-2">CPF</th>
                          <th className="text-left py-2 px-2">Curso</th>
                          <th className="text-right py-2 px-2">Valor</th>
                          <th className="text-center py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="py-2 px-2 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="py-2 px-2">{p.profile?.name || "—"}</td>
                            <td className="py-2 px-2">{p.profile?.cpf || "—"}</td>
                            <td className="py-2 px-2">{p.courses?.title || "—"}</td>
                            <td className="py-2 px-2 text-right whitespace-nowrap">R$ {Number(p.amount).toFixed(2)}</td>
                            <td className="py-2 px-2 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {p.status === "paid" ? "Pago" : p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
