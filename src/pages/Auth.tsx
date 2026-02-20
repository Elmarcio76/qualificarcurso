import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo2.png";
import { useAuth } from "@/hooks/useAuth";

function maskCPF(value: string) {
  return value.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});
const signupSchema = z.object({
  name: z.string().trim().min(2, { message: "Nome é obrigatório" }).max(100),
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  cpf: z.string().optional(),
  phone: z.string().min(14, { message: "Telefone inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/student");
    }
  }, [user, authLoading, navigate]);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { name: "", email: "", cpf: "", phone: "", password: "", confirmPassword: "" } });

  const onLogin = async (values: LoginValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login realizado!" });
      navigate("/student");
    }
  };

  const onSignup = async (values: SignupValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name: values.name, cpf: values.cpf, phone: values.phone },
        },
      });
      setLoading(false);
      if (error) {
        toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
        return;
      }
      // Supabase returns a user with fake id when email already exists (security measure)
      if (data?.user?.identities?.length === 0) {
        toast({ title: "Email já cadastrado", description: "Esse email já está em uso. Tente fazer login.", variant: "destructive" });
        return;
      }
      if (data?.session) {
        toast({ title: "Cadastro realizado com sucesso!" });
        navigate("/student");
      } else if (data?.user) {
        // Auto-login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (!loginError) {
          toast({ title: "Cadastro realizado com sucesso!" });
          navigate("/student");
        } else {
          toast({ title: "Cadastro realizado!", description: "Faça login para continuar." });
        }
      }
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Erro inesperado", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const PasswordToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <Layout>
    <div className="flex min-h-[85vh] items-center justify-center p-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8), hsl(var(--auth-gradient-end)))" }}>
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="Qualificar Cursos" className="h-20 w-auto object-contain" />
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Senha</FormLabel><FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="••••••" {...field} /><PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} /></div></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <FormField control={signupForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="cpf" render={({ field }) => (
                    <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" value={field.value} onChange={(e) => field.onChange(maskCPF(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" value={field.value} onChange={(e) => field.onChange(maskPhone(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Senha</FormLabel><FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="••••••" {...field} /><PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} /></div></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem><FormLabel>Confirmar senha</FormLabel><FormControl><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••" {...field} /><PasswordToggle show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} /></div></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar"}</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
};

export default Auth;
