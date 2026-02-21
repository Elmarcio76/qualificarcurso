import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <Layout>
      <section className="py-16 bg-primary min-h-[60vh] flex items-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-bold text-primary-foreground text-center mb-10">
            Fale Conosco
          </h1>
          <Card className="bg-card/10 border-border/20">
            <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
              <Mail className="h-16 w-16 text-accent" />
              <div>
                <p className="text-primary-foreground text-lg mb-2">
                  Entre em contato conosco pelo e-mail:
                </p>
                <a
                  href="mailto:pedidos.viaboots@gmail.com"
                  className="text-accent text-xl font-semibold hover:underline"
                >
                  pedidos.viaboots@gmail.com
                </a>
              </div>
              <p className="text-primary-foreground/70 text-sm">
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
