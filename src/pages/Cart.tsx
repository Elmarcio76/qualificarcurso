import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Tag, ArrowLeft } from "lucide-react";

const Cart = () => {
  const { user } = useAuth();
  const { items, removeItem, total, discount, setDiscount, couponCode, setCouponCode, clearCart } = useCart();
  const navigate = useNavigate();
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) { navigate("/auth"); return; }
    setLoadingCoupon(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code: couponCode.trim().toUpperCase() },
      });
      if (error) throw error;
      if (data?.valid) {
        setDiscount(Number(data.discount_percent));
        toast({ title: `Cupom aplicado! ${data.discount_percent}% de desconto` });
      } else {
        toast({ title: data?.message || "Cupom inválido", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao validar cupom", variant: "destructive" });
    }
    setLoadingCoupon(false);
  };

  const handleCheckout = async () => {
    if (!user) { navigate("/auth"); return; }
    if (items.length === 0) return;
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((i) => ({ course_id: i.id, title: i.title, price: i.price, stripe_price_id: i.stripe_price_id })),
          coupon_code: couponCode || undefined,
        },
      });
      if (error) throw error;
      if (data?.url) {
        clearCart();
        window.open(data.url, "_blank");
        navigate("/student");
      }
    } catch (err: any) {
      toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
    }
    setLoadingPayment(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Carrinho</h1>
        </div>
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Seu carrinho está vazio. <Button variant="link" onClick={() => navigate("/")}>Ver cursos</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader><CardTitle className="text-base">Cupom de desconto</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="CÓDIGO" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                  <Button variant="outline" onClick={applyCoupon} disabled={loadingCoupon}>
                    <Tag className="mr-1 h-4 w-4" /> Aplicar
                  </Button>
                </div>
                {discount > 0 && <p className="mt-2 text-sm text-green-600">Desconto de {discount}% aplicado!</p>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={handleCheckout} disabled={loadingPayment}>
                  {loadingPayment ? "Processando..." : "Finalizar Pagamento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
