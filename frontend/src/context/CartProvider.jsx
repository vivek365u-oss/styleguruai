// ============================================================
// StyleGuruAI — Shopping Cart Context
// Global cart state management with Cross-Device Cloud Sync
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import { CartContext } from './CartContext';
import { auth, saveCloudCart, loadCloudCart } from '../api/styleApi';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('sg_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cross-device sync on login
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const cloudItems = await loadCloudCart(user.uid);
          if (cloudItems && cloudItems.length > 0) {
            setCart((currentLocal) => {
              const mergedMap = new Map();
              cloudItems.forEach(item => mergedMap.set(item.id, item));
              currentLocal.forEach(item => {
                if (mergedMap.has(item.id)) {
                  const existing = mergedMap.get(item.id);
                  existing.quantity = Math.max(existing.quantity, item.quantity);
                } else {
                  mergedMap.set(item.id, item);
                }
              });
              const merged = Array.from(mergedMap.values());
              saveCloudCart(user.uid, merged);
              return merged;
            });
          } else if (cart.length > 0) {
            // Initial upload of guest items
            saveCloudCart(user.uid, cart);
          }
        } catch (e) {
          console.warn('[Cart] Sync on login failed:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save cart to localStorage (instant cache) and Firestore (cross-device)
  useEffect(() => {
    try {
      localStorage.setItem('sg_cart', JSON.stringify(cart));
      if (auth.currentUser) {
        saveCloudCart(auth.currentUser.uid, cart);
      }
    } catch (e) {
      console.error('[Cart] Failed to save:', e);
    }
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
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
    total: 0,
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
