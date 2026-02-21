import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <Layout>
      <section className="py-16 bg-background flex-1 flex items-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground text-center mb-10">
            Fale Conosco
          </h1>
          <Card className="bg-card border-border">
            <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
              <Mail className="h-16 w-16 text-primary" />
              <div>
                <p className="text-foreground text-lg mb-2">
                  Entre em contato conosco pelo e-mail:
                </p>
                <a
                  href="mailto:pedidos.viaboots@gmail.com"
                  className="text-primary text-xl font-semibold hover:underline"
                >
                  pedidos.viaboots@gmail.com
                </a>
              </div>
              <p className="text-muted-foreground text-sm">
                Responderemos o mais breve possível. Obrigado pelo contato!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
