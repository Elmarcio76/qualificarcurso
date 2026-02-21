import Layout from "@/components/Layout";
import legalBg from "@/assets/legal-bg.jpg";
import { Monitor, BookOpen, FileCheck } from "lucide-react";

const cards = [
  "Cursos preparados para você, Servidor Público, evoluir em sua carreira e melhorar seus rendimentos com a obtenção do seu Adicional de Qualificação.",
  "Oferecemos cursos em várias áreas do conhecimento.",
  "Cursos Livres - Decreto Presidencial nº 5.154, de 23 de julho de 2004, e na Lei nº 9.394/96 - LDB",
];

const steps = [
  {
    icon: Monitor,
    title: "Acesse onde e quando quiser",
    description:
      "Estude no seu ritmo. Acesse seu curso e estude pela apostila fornecida.",
  },
  {
    icon: BookOpen,
    title: "Conteúdo atualizado",
    description:
      "Assista as aulas em vídeo indicadas, são materiais de terceiros destinados a complementar seus estudos.",
  },
  {
    icon: FileCheck,
    title: "Faça sua prova!",
    description:
      "Ela será liberada 30 dias após sua matrícula. Aguarde o prazo, realize a prova e tire nota acima de 6 para emitir o Certificado.",
  },
];

const CourseInfo = () => {
  return (
    <Layout>
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-accent text-center mb-10 italic">
            Base Legal dos Cursos Ofertados
          </h1>
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              backgroundImage: `url(${legalBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-primary/70" />
            <div className="relative grid gap-6 md:grid-cols-3 p-8 md:p-12">
              {cards.map((text, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-primary/50 backdrop-blur-sm border border-border/20 p-6 flex items-center"
                >
                  <p className="text-primary-foreground text-sm leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">
            Como funciona a Qualificar?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary p-4">
                  <step.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-primary/80 text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CourseInfo;
