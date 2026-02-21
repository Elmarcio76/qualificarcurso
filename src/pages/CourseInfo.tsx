import Layout from "@/components/Layout";
import legalBg from "@/assets/legal-bg.jpg";

const cards = [
  "Cursos preparados para você, Servidor Público, evoluir em sua carreira e melhorar seus rendimentos com a obtenção do seu Adicional de Qualificação.",
  "Oferecemos cursos em várias áreas do conhecimento.",
  "Cursos Livres - Decreto Presidencial nº 5.154, de 23 de julho de 2004, e na Lei nº 9.394/96 - LDB",
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
    </Layout>
  );
};

export default CourseInfo;
