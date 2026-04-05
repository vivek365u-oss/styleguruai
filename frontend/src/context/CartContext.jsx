// ============================================================
// StyleGuru — Shopping Cart Context
// Global cart state management for products
// ============================================================
import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Add item to cart
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      // Check if product already in cart
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Increase quantity
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Add new item
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter(item => item.id !== productId));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate totals
  const totals = {
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    tax: cart.reduce((sum, item) => sum + (item.price * item.quantity * 0.18), 0), // 18% GST
    commission: cart.reduce((sum, item) => sum + (item.price * item.quantity * 0.04), 0), // 4% affiliate
    total: 0, // Calculated below
  };
  
  totals.total = totals.subtotal + totals.tax;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totals
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default CartContext;
