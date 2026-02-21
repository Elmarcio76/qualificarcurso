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
      <section className="py-16 bg-background flex-1">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground text-center mb-10">
            Perguntas Frequentes
          </h1>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg bg-card px-4"
              >
                <AccordionTrigger className="text-foreground hover:no-underline text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
