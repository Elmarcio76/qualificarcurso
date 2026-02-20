import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, CheckCircle, XCircle } from "lucide-react";

const VerifyCertificate = () => {
  const [certNumber, setCertNumber] = useState("");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const trimmed = certNumber.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const { data, error } = await supabase.functions.invoke("verify-certificate", {
        body: { certificate_number: trimmed },
      });

      if (error) throw error;

      if (!data?.found) {
        setNotFound(true);
      } else {
        setResult(data);
      }
    } catch {
      setNotFound(true);
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Verificação de Certificado</h1>
          <p className="text-muted-foreground">
            Informe o número do certificado para verificar sua autenticidade.
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <Input
            placeholder="Digite o número do certificado (ex: 847293)"
            value={certNumber}
            onChange={(e) => setCertNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="text-lg h-12"
          />
          <Button size="lg" onClick={handleVerify} disabled={loading || !certNumber.trim()}>
            <Search className="h-5 w-5 mr-2" />
            {loading ? "Buscando..." : "Verificar"}
          </Button>
        </div>

        {notFound && (
          <Card className="border-destructive">
            <CardContent className="p-6 flex items-center gap-4">
              <XCircle className="h-10 w-10 text-destructive shrink-0" />
              <div>
                <p className="font-bold text-destructive text-lg">Certificado não encontrado</p>
                <p className="text-muted-foreground text-sm">
                  O número informado não corresponde a nenhum certificado emitido. Verifique os dados e tente novamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-primary">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-primary text-lg">Certificado Válido</p>
                  <p className="text-sm text-muted-foreground">Nº {result.certificate_number}</p>
                </div>
              </div>

              <div className="grid gap-4 divide-y divide-border">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium">Aluno</p>
                    <p className="font-semibold text-base">{result.student_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">CPF</p>
                    <p className="font-semibold">{result.cpf ?? "—"}</p>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium">Curso Realizado</p>
                    <p className="font-semibold text-base text-primary">{result.course?.title ?? "—"}</p>
                  </div>
                  {result.course?.workload && (
                    <div>
                      <p className="text-muted-foreground font-medium">Carga Horária</p>
                      <p className="font-semibold">{result.course.workload}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium">Data de Matrícula</p>
                    <p className="font-semibold">
                      {result.enrolled_at
                        ? new Date(result.enrolled_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Data da Prova</p>
                    <p className="font-semibold">
                      {result.exam_date
                        ? new Date(result.exam_date).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Nota</p>
                    <p className="font-semibold text-primary text-base">
                      {result.exam_score != null ? `${Math.round(result.exam_score)}/10` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default VerifyCertificate;
