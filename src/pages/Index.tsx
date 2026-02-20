import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Clock, ShoppingCart, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Index = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [confirmCourse, setConfirmCourse] = useState<any | null>(null);

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("active", true)
      .then(({ data }) => {
        if (data) setCourses(data);
      });
  }, []);

  return (
    <Layout>
      <section className="py-20 text-center bg-primary">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">Qualificar Cursos</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Qualifique-se com nossos cursos online. Estude no seu ritmo e conquiste seu certificado.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 py-6 text-base shadow-lg"
              onClick={() => navigate("/verify-certificate")}
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              VERIFICAÇÃO DE CERTIFICADO
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Nossos Cursos</h2>
        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum curso disponível no momento.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">{course.short_description || course.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {course.workload && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.workload}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Online
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-bold text-primary">
                    {course.price > 0 ? `R$ ${Number(course.price).toFixed(2)}` : "Gratuito"}
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/course/${course.id}`)}>
                    Ver curso
                  </Button>
                  {user && course.price > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmCourse(course)}
                    >
                      <ShoppingCart className="mr-1 h-4 w-4" /> Adicionar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

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

export default Index;
