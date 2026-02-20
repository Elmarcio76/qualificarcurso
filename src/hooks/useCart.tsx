import { createContext, useContext, useState, ReactNode } from "react";

interface CartItem {
  id: string;
  title: string;
  price: number;
  stripe_price_id: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  discount: number;
  setDiscount: (d: number) => void;
  couponCode: string;
  setCouponCode: (c: string) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  total: 0,
  discount: 0,
  setDiscount: () => {},
  couponCode: "",
  setCouponCode: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  const addItem = (item: CartItem) => {
    setItems((prev) => (prev.find((i) => i.id === item.id) ? prev : [...prev, item]));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(0);
    setCouponCode("");
  };

  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const total = Math.max(0, subtotal - subtotal * (discount / 100));

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, discount, setDiscount, couponCode, setCouponCode }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
