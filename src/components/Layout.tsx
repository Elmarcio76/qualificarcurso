import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
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

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {!isHome && (
        <div className="container mx-auto px-4 pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium"
          >
            <Home className="h-4 w-4" />
            Página Inicial
          </Link>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
