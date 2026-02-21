import Layout from "@/components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Posso estudar no meu próprio ritmo?",
    answer:
      "Claro! Todos os cursos estão na sua área, permitindo que você assista às aulas (que são recomendadas apenas para que aprenda no seu tempo, sem pressão).",
  },
  {
    question: "Os cursos são atualizados?",
    answer:
      "Sim! Atualizamos constantemente os conteúdos para garantir que você esteja sempre aprendendo o que está atualizado.",
  },
  {
    question: "Quais as formas de pagamento são aceitas?",
    answer: "Aceitamos cartões de crédito.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Não temos assinaturas, basta fazer seu curso.",
  },
  {
    question: "Existe suporte caso eu tenha dúvidas durante o curso?",
    answer:
      "Sim! Nosso time de suporte e os instrutores estão prontos para te ajudar via e-mail ou WhatsApp.",
  },
];

const FAQ = () => {
  return (
    <Layout>
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold text-primary-foreground text-center mb-10">
            Perguntas Frequentes
          </h1>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/20 rounded-lg bg-primary/80 px-4"
              >
                <AccordionTrigger className="text-primary-foreground hover:no-underline text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-accent">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="bg-primary/95 border-t border-border/20 py-10">
        <div className="container mx-auto px-4 text-center space-y-3">
          <p className="text-primary-foreground font-semibold">
            Qualificar Cursos
          </p>
          <p className="text-primary-foreground/70 text-sm">
            Dúvidas? Entre em contato:{" "}
            <a
              href="mailto:pedidos.viaboots@gmail.com"
              className="text-accent hover:underline"
            >
              pedidos.viaboots@gmail.com
            </a>
          </p>
          <p className="text-primary-foreground/50 text-xs">
            © {new Date().getFullYear()} Qualificar Cursos. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </Layout>
  );
};

export default FAQ;
