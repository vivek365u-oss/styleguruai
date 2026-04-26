/**
 * useNotifications.js — StyleGuru AI v2.0
 * ════════════════════════════════════════════════════════════════════
 * Smart, personalized notification scheduler.
 *
 * HOW IT WORKS:
 *   1. Requests browser notification permission (once, non-intrusively)
 *   2. Sends "SCHEDULE_NOTIFICATION" messages to the Service Worker
 *   3. SW stores a setTimeout — fires even when app is in background
 *   4. Each notification deep-links to the relevant tab
 *
 * NOTIFICATION TYPES:
 *   🌅 morning_brief  — 8 AM: Weather + DNA + Day's outfit
 *   🔥 streak_guard   — 8 PM: Remind user to log outfit if streak active
 *   👋 welcome_back   — After 3 days inactive: Re-engagement
 *
 * LIMITATIONS:
 *   - Works only while browser is running (PWA limitation without FCM)
 *   - iOS Safari: Notifications only work if app is added to Home Screen
 * ════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Notification copy (Catchy, High-CTR, Zomato/Myntra style) ────────
const MORNING_COPIES = [
    (name, temp, archetype) => `Barish ka mausam hai ya garmi? 🌡️ Aaj ke ${temp}°C ke liye ek perfect ${archetype} look ready hai. Tap to see! 🚀`,
    (name, temp, archetype) => `Rise & style${name ? `, ${name}` : ''}! 🌅 Aaj ${temp}°C hai. Apna favorite light-wash outfit check karein? ✨`,
    (name, temp, archetype) => `Uff yeh mausam! ☔ AI ne aaj ke liye monsoon-safe look banaya hai. Check now! 🎨`,
];

const STREAK_COPIES = [
    (count) => `Don't let the vibe die! 🔥 ${count}-day Style Streak is active. Log your look before midnight. 🏆`,
    (count) => `${count} days strong! 💪 Aaj kya pehna? Quickly log your outfit to keep the streak going! 🔥`,
    (count) => `Your ${count}-day streak is at risk! ⚠️ 2 minutes lagega bas apna look log karne mein. 🎯`,
];

const WELCOME_BACK_COPIES = [
    () => `Aapki 'White Sneakers' aapko miss kar rahi hain! 👟 Aaj unko ek casual outfit ke saath pair karein?`,
    () => `Style doesn't take breaks! 🌟 Naye trends aapke DNA ke hisaab se match kiye gaye hain. 🪞`,
    () => `Been a while! Aapka Style DNA aur zyada smart ho gaya hai. Come see what's new. 🎨`,
];

const LAUNDRY_COPIES = [
    () => `Aapke favorite kapde laundry mein hain 🧺. Aaj wash kar lo, weekend party ke liye ready ho jayenge!`,
    () => `Running low on fresh fits? 🧺 Give your wardrobe a wash cycle today for a sharp tomorrow.`,
    () => `Weekend vibe check! ✨ Laundry clear karo aur kal ke date-night look ke liye ready raho. 👗`,
];

const TREND_COPIES = [
    (archetype) => `Going out with your partner? 👫 Naya 'Couple Vibe Check' try karein aur perfectly match karein! 🔥`,
    (archetype) => `You have 1 Free AI Scan left today! 📸 Nayi shirt khareedne se pehle check kar lo wo aapke undertone pe kaisa lagega.`,
    (archetype) => `Aapka '${archetype}' DNA sirf 15% logo mein milta hai! 🧬 Aaj ek perfect combo try karein aur compliments paayein.`,
];

// ── Helper: ms until next HH:MM today (or tomorrow if passed) ─────────
function msUntilTime(hour, minute = 0) {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) {
        target.setDate(target.getDate() + 1); // Schedule for tomorrow if already passed
    }
    return target.getTime() - now.getTime();
}

// ── Helper: Random item from array ────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Send message to Service Worker ────────────────────────────────────
async function sendToSW(message) {
    if (!('serviceWorker' in navigator)) return false;
    try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
            reg.active.postMessage(message);
            return true;
        }
    } catch (e) {
        console.warn('[Notifications] SW message failed:', e);
    }
    return false;
}

// ════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ════════════════════════════════════════════════════════════════════
export function useNotifications({ user, streak = 0, archetype = 'The Minimalist', weather = null } = {}) {
    const [permission, setPermission] = useState(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            return Notification.permission; // 'default' | 'granted' | 'denied'
        }
        return 'unsupported';
    });
    const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('sg_notif_on') === 'true');
    const scheduledRef = useRef(false);

    // ── Check support ──────────────────────────────────────────────
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

    // ── Request permission ─────────────────────────────────────────
    const requestPermission = useCallback(async () => {
        if (!isSupported) return 'unsupported';
        if (permission === 'denied') return 'denied';

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm === 'granted') {
                localStorage.setItem('sg_notif_on', 'true');
                setIsEnabled(true);

                // Welcome notification — fired immediately to confirm
                const reg = await navigator.serviceWorker.ready;
                reg.showNotification('StyleGuru AI 🎨', {
                    body: 'Daily style briefs enabled! Your personal stylist is ready. ✨',
                    icon: '/logo.png',
                    badge: '/icons/icon-192x192.png',
                    tag: 'welcome',
                    data: { url: '/?tab=home' },
                });
            } else {
                localStorage.setItem('sg_notif_on', 'false');
                setIsEnabled(false);
            }
            return perm;
        } catch (e) {
            console.error('[Notifications] Permission request failed:', e);
            return 'error';
        }
    }, [permission, isSupported]);

    // ── Disable notifications ──────────────────────────────────────
    const disableNotifications = useCallback(async () => {
        localStorage.setItem('sg_notif_on', 'false');
        setIsEnabled(false);
        await sendToSW({ type: 'CANCEL_ALL' });
    }, []);

    // ── Schedule all smart notifications ──────────────────────────
    const scheduleAll = useCallback(async () => {
        if (!isEnabled || permission !== 'granted') return;
        if (scheduledRef.current) return; // Already scheduled this session
        scheduledRef.current = true;

        const name = user?.name?.split(' ')[0] || '';
        const temp = weather?.temp || 25;
        const today = new Date().toLocaleDateString('en-CA');
        const lastStreakLog = localStorage.getItem('sg_last_streak_notification');

        // 1. Morning Brief — 8:00 AM ──────────────────────────────
        const morningDelay = msUntilTime(8, 0);
        const morningCopy = pick(MORNING_COPIES);
        await sendToSW({
            type: 'SCHEDULE_NOTIFICATION',
            payload: {
                id: 'morning_brief',
                delayMs: morningDelay,
                title: '🌅 Your Style Brief is Ready',
                body: morningCopy(name, temp, archetype),
                url: '/?tab=tools',
                tag: 'morning_brief',
                requireInteraction: false,
            },
        });
        console.log(`[Notifications] Morning brief scheduled in ${Math.round(morningDelay / 3600000 * 10) / 10}h`);

        // 2. Streak Guard — 8:00 PM (only if streak > 0 and not logged today) ──
        if (streak > 0 && lastStreakLog !== today) {
            const eveningDelay = msUntilTime(20, 0);
            const streakCopy = pick(STREAK_COPIES);
            await sendToSW({
                type: 'SCHEDULE_NOTIFICATION',
                payload: {
                    id: 'streak_guard',
                    delayMs: eveningDelay,
                    title: '🔥 Keep Your Style Streak Alive!',
                    body: streakCopy(streak),
                    url: '/?tab=tools',
                    tag: 'streak_guard',
                    requireInteraction: true, // Stays until dismissed
                },
            });
            console.log(`[Notifications] Streak guard scheduled in ${Math.round(eveningDelay / 3600000 * 10) / 10}h`);
        }

        // 3. Laundry Guard — 10:00 AM ────────────────────────────────────
        // Check local storage for wardrobe to see if anything is in laundry
        try {
            const wardrobe = JSON.parse(localStorage.getItem('sg_wardrobe') || '[]');
            const inLaundry = wardrobe.filter(item => item.status === 'laundry' || item.status === 'dirty').length > 0;
            
            // Only schedule if there's actually something in the laundry
            // Or, if wardrobe is empty locally, we schedule it anyway as a general reminder
            if (inLaundry || wardrobe.length === 0) {
                const laundryDelay = msUntilTime(10, 0);
                const laundryCopy = pick(LAUNDRY_COPIES);
                await sendToSW({
                    type: 'SCHEDULE_NOTIFICATION',
                    payload: {
                        id: 'laundry_guard',
                        delayMs: laundryDelay,
                        title: '🧺 Laundry Reminder',
                        body: laundryCopy(),
                        url: '/?tab=wardrobe',
                        tag: 'laundry_guard',
                        requireInteraction: false,
                    },
                });
                console.log(`[Notifications] Laundry guard scheduled in ${Math.round(laundryDelay / 3600000 * 10) / 10}h`);
            }
        } catch (e) {
            console.warn('[Notifications] Failed to schedule laundry guard', e);
        }

        // 4. DNA Trend Spotter — 11:00 AM ─────────────────────────
        const trendDelay = msUntilTime(11, 0);
        const trendCopy = pick(TREND_COPIES);
        await sendToSW({
            type: 'SCHEDULE_NOTIFICATION',
            payload: {
                id: 'trend_spotter',
                delayMs: trendDelay,
                title: '🔥 Style Compass Update',
                body: trendCopy(archetype),
                url: '/?tab=tools',
                tag: 'trend_spotter',
                requireInteraction: false,
            },
        });
        console.log(`[Notifications] Trend spotter scheduled in ${Math.round(trendDelay / 3600000 * 10) / 10}h`);

        // 5. Welcome Back — if last_active_date > 3 days ago ──────
        const lastActive = localStorage.getItem('sg_last_checkin');
        if (lastActive) {
            const diffDays = Math.round((Date.now() - new Date(lastActive)) / 86400000);
            if (diffDays >= 3) {
                const welcomeCopy = pick(WELCOME_BACK_COPIES);
                // Show after 30 seconds (immediate re-engagement)
                await sendToSW({
                    type: 'SCHEDULE_NOTIFICATION',
                    payload: {
                        id: 'welcome_back',
                        delayMs: 30000,
                        title: '👋 Welcome Back to StyleGuru AI!',
                        body: welcomeCopy(),
                        url: '/?tab=navigator',
                        tag: 'welcome_back',
                        requireInteraction: false,
                    },
                });
            }
        }
    }, [isEnabled, permission, user, streak, archetype, weather]);

    // ── Mark streak as notified today (call from OutfitCalendar on log) ──
    const markStreakNotified = useCallback(() => {
        const today = new Date().toLocaleDateString('en-CA');
        localStorage.setItem('sg_last_streak_notification', today);
        // Cancel the evening streak guard since user already logged
        sendToSW({ type: 'CANCEL_NOTIFICATION', payload: { id: 'streak_guard' } });
    }, []);

    // ── Auto-schedule whenever enabled + permission granted ────────
    useEffect(() => {
        if (isEnabled && permission === 'granted') {
            scheduleAll();
        }
    }, [isEnabled, permission, scheduleAll]);

    // ── Handle SW deep-link messages ──────────────────────────────
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        const handler = (event) => {
            if (event.data?.type === 'NAVIGATE') {
                const url = event.data.url;
                const params = new URLSearchParams(url.split('?')[1] || '');
                const tab = params.get('tab');
                if (tab) {
                    // Dispatch a custom event that AppShell listens to
                    window.dispatchEvent(new CustomEvent('sg_navigate', { detail: { tab } }));
                }
            }
        };
        navigator.serviceWorker.addEventListener('message', handler);
        return () => navigator.serviceWorker.removeEventListener('message', handler);
    }, []);

    return {
        isSupported,
        permission,
        isEnabled,
        requestPermission,
        disableNotifications,
        scheduleAll,
        markStreakNotified,
    };
}
