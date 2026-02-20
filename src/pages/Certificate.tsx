import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import certificateBg from "@/assets/certificate-bg.png";
import certificateBgBack from "@/assets/certificate-bg-back.png";

interface CertificateData {
  id: string;
  certificate_number: string;
  generated_at: string;
  course_id: string;
  user_id: string;
}

const Certificate = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [examResult, setExamResult] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!courseId) return;

    const fetchAll = async () => {
      try {
        setDataLoading(true);
        setError(null);
        const [certRes, courseRes, enrRes, examRes] = await Promise.all([
          supabase.from("certificates").select("*").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
          supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
          supabase.from("enrollments").select("*").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
          supabase
            .from("exam_results")
            .select("score, completed_at")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .gte("score", 7)
            .order("completed_at", { ascending: false })
            .limit(1),
        ]);
        if (certRes.error) throw certRes.error;
        if (courseRes.error) throw courseRes.error;
        if (!certRes.data) {
          setError("Certificado não encontrado para este curso.");
          setDataLoading(false);
          return;
        }
        setCertificate(certRes.data);
        setCourse(courseRes.data);
        setEnrollment(enrRes.data);
        setExamResult(examRes.data?.[0] ?? null);
      } catch (err: any) {
        console.error("Error loading certificate:", err);
        setError("Erro ao carregar o certificado. Tente novamente.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchAll();
  }, [courseId, user, authLoading]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR");

  const getEmitidoDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} de ${d.toLocaleString("pt-BR", { month: "long" })} de ${d.getFullYear()}`;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

  // Computed values
  const score = examResult?.score ?? 0;
  const nota = score.toFixed(1);
  const aproveitamento = `${Math.round(score * 10)}%`;
  const periodoInicio = enrollment ? formatDate(enrollment.enrolled_at) : "—";
  const periodoFim = examResult ? formatDate(examResult.completed_at) : "—";
  const workload = course?.workload ?? "120 horas";
  const emitidoDate = certificate ? getEmitidoDate(certificate.generated_at) : "";

  const bodyText =
    profile && course
      ? `CPF nº ${profile.cpf ?? "—"}, concluiu com êxito o CURSO "${course.title}", com carga horária total de ${workload}, realizado no período de ${periodoInicio} a ${periodoFim}, demonstrando aproveitamento de ${aproveitamento}, alcançando nota ${nota} em todas as atividades propostas.`
      : "";

  const generatePDF = async () => {
    if (!certificate || !course || !profile) return;
    try {
      const [imgFront, imgBack] = await Promise.all([loadImage(certificateBg), loadImage(certificateBgBack)]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      /* ===== FRENTE ===== */
      doc.addImage(imgFront, "PNG", 0, 0, w, h);

      const leftMargin = 50; // 5cm
      const rightMargin = 20;
      const textWidth = w - leftMargin - rightMargin;
      const textCenterX = leftMargin + textWidth / 2;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(29);
      doc.setTextColor(30, 50, 90);
      let y = 45;
      doc.text("CERTIFICADO DE CONCLUSÃO", textCenterX, y, { align: "center" });

      // Subtitle
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      doc.text("Este Certificado é concedido a", textCenterX, y, { align: "center" });

      // Name
      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(30, 50, 90);
      doc.text(profile.name, textCenterX, y, { align: "center" });

      // Body text
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(15);
      doc.setTextColor(60, 60, 60);
      const pdfBody = `CPF nº ${profile.cpf ?? "—"}, concluiu com êxito o CURSO "${course.title}", com carga horária total de ${workload}, realizado no período de ${periodoInicio} a ${periodoFim}, demonstrando aproveitamento de ${aproveitamento}, alcançando nota ${nota} em todas as atividades propostas.`;
      const bodyLines = doc.splitTextToSize(pdfBody, textWidth);
      doc.text(bodyLines, leftMargin, y, { align: "justify", maxWidth: textWidth });

      // Emitido
      y += bodyLines.length * 6.5 + 14;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(15);
      doc.setTextColor(80, 80, 80);
      doc.text(`Emitido em Brasília - DF, no dia ${emitidoDate}.`, textCenterX, y, { align: "center" });

      // Certificate ID - bottom left in red
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(180, 0, 0);
      doc.text("ID CERTIFICADO", 14, h - 16);
      doc.setFontSize(16);
      doc.text(certificate.certificate_number, 14, h - 9);

      /* ===== VERSO ===== */
      doc.addPage();
      doc.addImage(imgBack, "PNG", 0, 0, w, h);

      const versoX = 30;
      const versoW = w - 60;
      let vy = 50;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const introText =
        "Curso realizado em ambiente virtual, com acompanhamento de tutoria durante todo o período de capacitação. Ao longo do curso, são realizados eventos assíncronos e, ao final, uma atividade avaliativa composta por 10 questões, totalizando 10 pontos. Para aprovação, é necessário obter, no mínimo, 7 pontos.";
      const introLines = doc.splitTextToSize(introText, versoW);
      doc.text(introLines, versoX, vy);
      vy += introLines.length * 4.5 + 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Tipo de curso: ", versoX, vy);
      doc.setFont("helvetica", "normal");
      doc.text("Atualização/Capacitação", versoX + doc.getTextWidth("Tipo de curso: "), vy);
      const modX = versoX + 90;
      doc.setFont("helvetica", "bold");
      doc.text("Modalidade: ", modX, vy);
      doc.setFont("helvetica", "normal");
      doc.text("A distância (E-learning)", modX + doc.getTextWidth("Modalidade: "), vy);
      vy += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Conteúdo Programático", versoX, vy);
      vy += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(`${course.title.toUpperCase()}: ${course.description ?? "—"}`, versoW);
      doc.text(descLines, versoX, vy);
      vy += descLines.length * 4 + 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("O curso inclui:", versoX, vy);
      vy += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      ["Material didático", "Videoaulas com legendas (Closed Caption)", "Certificado de conclusão"].forEach((item) => {
        doc.text(`•  ${item}`, versoX + 4, vy);
        vy += 4.5;
      });
      vy += 4;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Carga horária total: ", versoX, vy);
      doc.setFont("helvetica", "normal");
      doc.text(workload, versoX + doc.getTextWidth("Carga horária total: "), vy);
      vy += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const regLines = doc.splitTextToSize(
        `Certificado registrado no QUALIFICAR CURSO ONLINE sob o nº ${certificate.certificate_number}, expedido conforme o art. 3º, inciso I, do Decreto Federal nº 2.208/97.`,
        versoW,
      );
      doc.text(regLines, versoX, vy);
      vy += regLines.length * 4 + 6;

      doc.text(
        "Curso ministrado por: QUALIFICAR CURSOS ONLINE - CNPJ: 37.950.764/0001-58 - (NILVA SOBRAL DE COSTA ALMEIDA - MEI)",
        versoX,
        vy,
      );

      doc.save(`certificado-${course.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast({ title: "Erro ao gerar PDF", description: "Tente novamente.", variant: "destructive" });
    }
  };

  if (authLoading || dataLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Carregando certificado...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Certificado</h1>
          </div>
          <p className="text-destructive">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Seu Certificado</h1>
        </div>

        {/* Certificate Preview */}
        <div
          className="relative w-full mb-8 rounded-xl overflow-hidden shadow-2xl border border-border"
          style={{ aspectRatio: "297/210" }}
        >
          <img src={certificateBg} alt="Fundo do certificado" className="absolute inset-0 w-full h-full object-cover" />
          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col items-center pl-[16.8%] pr-[6.7%] pt-[10%]">
            {/* Title */}
            <h2 className="text-[2.6vw] font-bold tracking-wide" style={{ color: "#1e325a" }}>
              CERTIFICADO DE CONCLUSÃO
            </h2>

            {/* Subtitle */}
            <p className="text-[1.3vw] mt-[1.2vw]" style={{ color: "#555" }}>
              Este Certificado é concedido a
            </p>

            {/* Name */}
            <p className="text-[2.2vw] font-bold mt-[1vw]" style={{ color: "#1e325a" }}>
              {profile?.name}
            </p>

            {/* Body text */}
            <p className="text-[1.15vw] text-justify leading-relaxed mt-[1.2vw]" style={{ color: "#444" }}>
              {bodyText}
            </p>

            {/* Emitido */}
            <p className="text-[1.1vw] italic mt-[1.5vw]" style={{ color: "#666" }}>
              Emitido em Brasília - DF, no dia {emitidoDate}.
            </p>
          </div>

          {/* Certificate ID - bottom left */}
          <div className="absolute bottom-[4%] left-[4%]">
            <p className="text-[0.55vw] font-bold tracking-widest" style={{ color: "#b00000" }}>
              ID CERTIFICADO
            </p>
            <p className="text-[1.1vw] font-bold" style={{ color: "#b00000" }}>
              {certificate?.certificate_number}
            </p>
          </div>
        </div>

        {/* Download button */}
        <div className="flex justify-center">
          <Button size="lg" onClick={generatePDF} className="gap-2 text-base px-8 py-6 rounded-xl shadow-lg">
            <Download className="h-5 w-5" />
            Baixar PDF (Frente + Verso)
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Certificate;
