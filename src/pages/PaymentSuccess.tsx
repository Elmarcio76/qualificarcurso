import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ArrowLeft } from "lucide-react";

const PaymentSuccess = () => {
  const { user, loading: authLoading } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    clearCart();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const sessionId = searchParams.get("session_id");
    if (sessionId && user) {
      supabase.functions
        .invoke("verify-payment", { body: { session_id: sessionId } })
        .then(({ data, error }) => {
          if (!error && data?.success) {
            setVerified(true);
          }
          setVerifying(false);
        })
        .catch(() => setVerifying(false));
    } else {
      setVerifying(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (verified) {
      // Try to close this tab (works if opened via window.open)
      setTimeout(() => {
        window.close();
        // If close didn't work (browser restriction), user can click the button
      }, 3000);
    }
  }, [verified]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            {verifying ? (
              <>
                <Loader2 className="mx-auto h-16 w-16 text-primary mb-4 animate-spin" />
                <h1 className="text-2xl font-bold mb-2">Verificando pagamento...</h1>
                <p className="text-muted-foreground">Aguarde enquanto confirmamos seu pagamento.</p>
              </>
            ) : (
              <>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
                <p className="text-muted-foreground mb-6">
                  Sua matrícula foi realizada com sucesso.
                  {verified && " Redirecionando para seus cursos..."}
                </p>
                <Button onClick={() => navigate("/student")}>Ir para Meus Cursos</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
