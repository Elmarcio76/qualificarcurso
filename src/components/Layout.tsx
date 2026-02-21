import { ReactNode } from "react";
import Header from "./Header";

const Footer = () => (
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
);

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default Layout;
