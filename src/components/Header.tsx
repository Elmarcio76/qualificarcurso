import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, LogOut, User, Shield } from "lucide-react";
import logo from "@/assets/logo2.png";

const Header = () => {
  const { user, isAdmin, profile, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Qualificar Cursos" className="h-20 w-auto rounded bg-white px-2 py-0.5" />
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/student")}
              >
                <User className="mr-1 h-4 w-4" /> Área do Aluno{profile?.name ? ` - ${profile.name.split(" ")[0]}` : ""}
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="mr-1 h-4 w-4" /> Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="relative text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-4 w-4" />
                {items.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                    {items.length}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => navigate("/auth")}
              >
                Entrar
              </Button>

              <Button
                size="sm"
                className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => navigate("/auth")}
              >
                Cadastrar
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
