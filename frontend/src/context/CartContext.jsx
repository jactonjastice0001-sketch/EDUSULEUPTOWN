import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState({});

  function addItem(menuItem) {
    setItems((prev) => {
      const existing = prev[menuItem.id];
      const quantity = (existing?.quantity || 0) + 1;
      return { ...prev, [menuItem.id]: { id: menuItem.id, name: menuItem.name, price: menuItem.price_kes, quantity } };
    });
  }

  function setQuantity(menuItem, quantity) {
    setItems((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[menuItem.id];
        return next;
      }
      return { ...prev, [menuItem.id]: { id: menuItem.id, name: menuItem.name, price: menuItem.price_kes, quantity } };
    });
  }

  function removeItem(id) {
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function clearCart() {
    setItems({});
  }

  const list = useMemo(() => Object.values(items), [items]);
  const total = useMemo(() => list.reduce((sum, i) => sum + i.price * i.quantity, 0), [list]);
  const count = useMemo(() => list.reduce((sum, i) => sum + i.quantity, 0), [list]);

  return (
    <CartContext.Provider value={{ items, list, total, count, addItem, setQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
