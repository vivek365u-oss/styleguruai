/**
 * Firebase Sync Service
 * All user data syncs with Firestore automatically
 * 
 * Usage:
 * import { firebaseSync } from './firebaseSync';
 * 
 * await firebaseSync.saveAnalysis(analysisData);
 * const analyses = await firebaseSync.getAnalysisHistory();
 */

import { 
  doc, setDoc, getDoc, collection, 
  addDoc, updateDoc, query, where, getDocs, deleteDoc, orderBy, limit, Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

class FirebaseSync {
  /**
   * Get current authenticated user's UID
   */
  getUserId() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated - please login first');
    }
    return uid;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!auth.currentUser;
  }

  // ==================== PROFILE MANAGEMENT ====================

  /**
   * Update user profile (gender preference, theme, etc)
   */
  async updateProfile(profileData) {
    try {
      const uid = this.getUserId();
      const profileRef = doc(db, 'users', uid, 'profile', 'main');
      
      await setDoc(profileRef, {
        ...profileData,
        last_updated: Timestamp.now(),
        updated_at: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Profile updated to Firebase');
      return { success: true };
    } catch (err) {
      console.error('❌ Profile update failed:', err);
      throw err;
    }
  }

  /**
   * Get user's main profile
   */
  async getProfile() {
    try {
      const uid = this.getUserId();
      const profileRef = doc(db, 'users', uid, 'profile', 'main');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        console.log('✅ Profile loaded from Firebase');
        return profileSnap.data();
      }
      
      console.log('ℹ️  No profile found - first time user');
      return null;
    } catch (err) {
      console.error('❌ Profile fetch failed:', err);
      throw err;
    }
  }

  /**
   * Initialize new user profile
   */
  async initializeProfile(userData = {}) {
    try {
      const uid = this.getUserId();
      const profileRef = doc(db, 'users', uid, 'profile', 'main');
      
      await setDoc(profileRef, {
        email: auth.currentUser?.email || '',
        created_at: Timestamp.now(),
        last_updated: Timestamp.now(),
        analysis_count: 0,
        gender_preference: 'male',
        language_preference: 'en',
        theme_preference: 'dark',
        premium_status: false,
        subscription_plan: 'free',
        ...userData
      });
      
      console.log('✅ New user profile created');
      return { success: true };
    } catch (err) {
      console.error('❌ Profile initialization failed:', err);
      throw err;
    }
  }

  // ==================== SKIN ANALYSIS MANAGEMENT ====================

  /**
   * Save a new skin analysis
   */
  async saveAnalysis(analysisData) {
    try {
      const uid = this.getUserId();
      const analysesRef = collection(db, 'users', uid, 'skin_analyses');
      
      const docRef = await addDoc(analysesRef, {
        timestamp: Timestamp.now(),
        created_at: new Date().toISOString(),
        gender: analysisData.gender || 'male',
        skin_tone: analysisData.skin_tone || {},
        outfit_color: analysisData.outfit_color || null,
        recommendations: analysisData.recommendations || {},
        photo_quality_score: analysisData.photo_quality_score || 0,
        processing_time_ms: analysisData.processing_time_ms || 0,
        language: analysisData.language || 'en',
        ...analysisData
      });
      
      // Update profile with analysis count and last analysis date
      await this.updateProfile({
        last_analysis_date: Timestamp.now(),
        analysis_count: await this.getAnalysisCount() + 1
      });
      
      console.log('✅ Analysis saved to Firebase:', docRef.id);
      return { success: true, analysis_id: docRef.id };
    } catch (err) {
      console.error('❌ Analysis save failed:', err);
      throw err;
    }
  }

  /**
   * Get all skin analyses for user
   */
  async getAnalysisHistory() {
    try {
      const uid = this.getUserId();
      const analysesRef = collection(db, 'users', uid, 'skin_analyses');
      const snapshot = await getDocs(analysesRef);
      
      const analyses = [];
      snapshot.forEach(doc => {
        analyses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Loaded ${analyses.length} analyses from Firebase`);
      return analyses;
    } catch (err) {
      console.error('❌ Analysis history fetch failed:', err);
      throw err;
    }
  }

  /**
   * Get the most recent analysis
   */
  async getLatestAnalysis() {
    try {
      const uid = this.getUserId();
      const analysesRef = collection(db, 'users', uid, 'skin_analyses');
      const q = query(analysesRef, orderBy('timestamp', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('ℹ️  No analyses found');
        return null;
      }
      
      const latest = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      console.log('✅ Latest analysis loaded');
      return latest;
    } catch (err) {
      console.error('❌ Latest analysis fetch failed:', err);
      throw err;
    }
  }

  /**
   * Get total number of analyses
   */
  async getAnalysisCount() {
    try {
      const uid = this.getUserId();
      const analysesRef = collection(db, 'users', uid, 'skin_analyses');
      const snapshot = await getDocs(analysesRef);
      return snapshot.size;
    } catch (err) {
      console.error('❌ Analysis count fetch failed:', err);
      return 0;
    }
  }

  /**
   * Delete a specific analysis
   */
  async deleteAnalysis(analysisId) {
    try {
      const uid = this.getUserId();
      const analysisRef = doc(db, 'users', uid, 'skin_analyses', analysisId);
      await deleteDoc(analysisRef);
      
      console.log('✅ Analysis deleted');
      return { success: true };
    } catch (err) {
      console.error('❌ Analysis delete failed:', err);
      throw err;
    }
  }

  // ==================== SAVED COLORS MANAGEMENT ====================

  /**
   * Save a color to favorites
   */
  async saveColor(colorData) {
    try {
      const uid = this.getUserId();
      const colorsRef = collection(db, 'users', uid, 'saved_colors');
      
      const docRef = await addDoc(colorsRef, {
        color_name: colorData.color_name || 'Unknown',
        hex: colorData.hex || '#000000',
        rgb: colorData.rgb || { r: 0, g: 0, b: 0 },
        reason_saved: colorData.reason_saved || '',
        analysis_id: colorData.analysis_id || null,
        saved_at: Timestamp.now(),
        usage_count: 0,
        ...colorData
      });
      
      console.log('✅ Color saved to Firebase:', docRef.id);
      return { success: true, color_id: docRef.id };
    } catch (err) {
      console.error('❌ Color save failed:', err);
      throw err;
    }
  }

  /**
   * Get all saved colors
   */
  async getSavedColors() {
    try {
      const uid = this.getUserId();
      const colorsRef = collection(db, 'users', uid, 'saved_colors');
      const snapshot = await getDocs(colorsRef);
      
      const colors = [];
      snapshot.forEach(doc => {
        colors.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Loaded ${colors.length} saved colors`);
      return colors;
    } catch (err) {
      console.error('❌ Saved colors fetch failed:', err);
      throw err;
    }
  }

  /**
   * Delete a saved color
   */
  async deleteColor(colorId) {
    try {
      const uid = this.getUserId();
      const colorRef = doc(db, 'users', uid, 'saved_colors', colorId);
      await deleteDoc(colorRef);
      
      console.log('✅ Color deleted');
      return { success: true };
    } catch (err) {
      console.error('❌ Color delete failed:', err);
      throw err;
    }
  }

  // ==================== SHOPPING CART MANAGEMENT ====================

  /**
   * Update shopping cart in Firebase
   */
  async updateCart(cartItems) {
    try {
      const uid = this.getUserId();
      const cartRef = doc(db, 'users', uid, 'shopping_cart', 'active');
      
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
      
      await setDoc(cartRef, {
        items: cartItems,
        updated_at: Timestamp.now(),
        updated_at_str: new Date().toISOString(),
        item_count: cartItems.length,
        total_price: totalPrice
      });
      
      console.log('✅ Cart saved to Firebase');
      return { success: true };
    } catch (err) {
      console.error('❌ Cart update failed:', err);
      throw err;
    }
  }

  /**
   * Get user's shopping cart
   */
  async getCart() {
    try {
      const uid = this.getUserId();
      const cartRef = doc(db, 'users', uid, 'shopping_cart', 'active');
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        console.log('✅ Cart loaded from Firebase');
        return cartSnap.data().items || [];
      }
      
      console.log('ℹ️  Cart is empty');
      return [];
    } catch (err) {
      console.error('❌ Cart fetch failed:', err);
      throw err;
    }
  }

  /**
   * Clear shopping cart
   */
  async clearCart() {
    try {
      const uid = this.getUserId();
      const cartRef = doc(db, 'users', uid, 'shopping_cart', 'active');
      await deleteDoc(cartRef);
      
      console.log('✅ Cart cleared');
      return { success: true };
    } catch (err) {
      console.error('❌ Cart clear failed:', err);
      throw err;
    }
  }

  // ==================== PREFERENCES MANAGEMENT ====================

  /**
   * Update user preferences (notifications, privacy, etc)
   */
  async updatePreferences(preferences) {
    try {
      const uid = this.getUserId();
      const prefsRef = doc(db, 'users', uid, 'preferences', 'settings');
      
      await setDoc(prefsRef, {
        ...preferences,
        updated_at: Timestamp.now(),
        updated_at_str: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Preferences updated');
      return { success: true };
    } catch (err) {
      console.error('❌ Preferences update failed:', err);
      throw err;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences() {
    try {
      const uid = this.getUserId();
      const prefsRef = doc(db, 'users', uid, 'preferences', 'settings');
      const prefsSnap = await getDoc(prefsRef);
      
      const defaults = {
        notifications: { push_enabled: true, daily_tips: true },
        privacy: { show_in_community: false },
        ui_state: { theme: 'dark', language: 'en' }
      };
      
      if (prefsSnap.exists()) {
        console.log('✅ Preferences loaded');
        return { ...defaults, ...prefsSnap.data() };
      }
      
      return defaults;
    } catch (err) {
      console.error('❌ Preferences fetch failed:', err);
      return {};
    }
  }

  // ==================== FULL DATA SYNC ====================

  /**
   * Sync all user data from Firebase (call on app load)
   */
  async syncAllData() {
    try {
      console.log('🔄 Starting full data sync...');
      
      const [profile, analyses, colors, cart, prefs] = await Promise.all([
        this.getProfile(),
        this.getAnalysisHistory(),
        this.getSavedColors(),
        this.getCart(),
        this.getPreferences()
      ]);
      
      console.log('✅ All data synced successfully');
      return {
        profile,
        analyses,
        colors,
        cart,
        preferences: prefs
      };
    } catch (err) {
      console.error('❌ Full sync failed:', err);
      throw err;
    }
  }

  /**
   * Export all user data (for backup/migration)
   */
  async exportAllData() {
    try {
      const data = await this.syncAllData();
      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: this.getUserId(),
        ...data
      };
      
      console.log('✅ Data exported');
      return exportData;
    } catch (err) {
      console.error('❌ Export failed:', err);
      throw err;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get storage usage stats
   */
  async getStorageStats() {
    try {
      const uid = this.getUserId();
      const profile = await this.getProfile();
      const analyses = await this.getAnalysisHistory();
      const colors = await this.getSavedColors();
      const cart = await this.getCart();
      
      return {
        profile_size: JSON.stringify(profile).length,
        analyses_count: analyses.length,
        analyses_size: JSON.stringify(analyses).length,
        colors_count: colors.length,
        colors_size: JSON.stringify(colors).length,
        cart_items: cart.length,
        cart_size: JSON.stringify(cart).length,
        total_size: JSON.stringify({ profile, analyses, colors, cart }).length
      };
    } catch (err) {
      console.error('❌ Storage stats failed:', err);
      return {};
    }
  }

  /**
   * Clear all user data (dangerous - use with caution)
   */
  async deleteAllData() {
    try {
      if (!confirm('⚠️ Are you sure? This will delete ALL your data permanently!')) {
        return;
      }
      
      const uid = this.getUserId();
      const collections = ['skin_analyses', 'saved_colors', 'shopping_cart', 'preferences', 'profile'];
      
      for (const collName of collections) {
        const collRef = collection(db, 'users', uid, collName);
        const snapshot = await getDocs(collRef);
        
        for (const doc of snapshot.docs) {
          await deleteDoc(doc.ref);
        }
      }
      
      console.log('⚠️  All user data deleted');
      return { success: true };
    } catch (err) {
      console.error('❌ Delete all failed:', err);
      throw err;
    }
  }
}

// Export singleton instance
export const firebaseSync = new FirebaseSync();
export default firebaseSync;
