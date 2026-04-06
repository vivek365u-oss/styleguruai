/**
 * ISSUE 1 FIX: Plans/Upgrade Screen (NOT direct payment)
 * This replaces direct payment with a dedicated upgrade screen
 * Flow: Profile → Upgrade Screen → Payment
 */

import React, { useState, useContext } from 'react';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

export function PlansUpgradeScreen({ isDark = false, onSelectPlan, onClose }) {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      emoji: '🎁',
      price: '₹0',
      period: 'Forever',
      features: [
        { text: '1 Color Analysis', included: true },
        { text: '10 Outfit Checks', included: true },
        { text: 'Basic Recommendations', included: true },
        { text: 'Wardrobe History', included: false },
        { text: 'Unlimited Analysis', included: false },
        { text: 'Priority Support', included: false },
      ],
      cta: 'Current Plan',
      highlight: false,
      recommended: false,
    },
    {
      id: 'monthly',
      name: 'Pro Monthly',
      emoji: '⭐',
      price: '₹59',
      period: 'per month',
      features: [
        { text: 'Unlimited Analysis', included: true },
        { text: 'Unlimited Outfit Checks', included: true },
        { text: 'Advanced Recommendations', included: true },
        { text: 'Full Wardrobe History', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Cancel Anytime', included: true },
      ],
      cta: 'Upgrade Now',
      highlight: true,
      recommended: true,
    },
    {
      id: 'annual',
      name: 'Pro Annual',
      emoji: '🚀',
      price: '₹499',
      period: 'per year',
      features: [
        { text: 'Unlimited Analysis', included: true },
        { text: 'Unlimited Outfit Checks', included: true },
        { text: 'Advanced Recommendations', included: true },
        { text: 'Full Wardrobe History', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Save ₹200/year', included: true },
      ],
      cta: 'Best Value',
      highlight: true,
      recommended: false,
      badge: 'SAVE 17%',
    },
  ];

  const handleSelectPlan = (plan) => {
    if (plan.id === 'free') return; // Can't "upgrade" to free
    setSelectedPlan(plan);
    setShowConfirmation(true);
  };

  const handleConfirmUpgrade = () => {
    onSelectPlan(selectedPlan);
    setShowConfirmation(false);
  };

  // Confirmation Modal
  if (showConfirmation && selectedPlan) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmation(false)} />
        <div className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-[#0f1123]' : 'bg-white'}`}>
          <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {selectedPlan.emoji} Confirm Upgrade
          </h3>
          <p className={`mb-6 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            You're about to upgrade to <strong>{selectedPlan.name}</strong> for <strong>{selectedPlan.price} {selectedPlan.period}</strong>
          </p>

          <div className="space-y-3 mb-6">
            {selectedPlan.features.filter(f => f.included).map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className={isDark ? 'text-white/80' : 'text-gray-700'}>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpgrade}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDark ? 'bg-[#0a0e27]' : 'bg-gradient-to-b from-purple-50 to-white'}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Choose Your Plan</h1>
          <p className="text-white/80 text-sm">Unlock premium features</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
        >
          ✕
        </button>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl overflow-hidden transition-all transform hover:scale-105 ${
                plan.highlight
                  ? isDark
                    ? 'bg-gradient-to-br from-purple-900 to-pink-900 border-2 border-purple-500 shadow-2xl'
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400 shadow-xl'
                  : isDark
                  ? 'bg-white/10 border border-white/20 shadow-lg'
                  : 'bg-white border border-gray-200 shadow-lg'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              {plan.recommended && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full">
                  ★ RECOMMENDED
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                <div className="text-5xl mb-4">{plan.emoji}</div>

                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : plan.highlight ? 'text-purple-900' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <div className={`text-3xl font-black ${isDark ? 'text-white' : plan.highlight ? 'text-purple-600' : 'text-gray-900'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {plan.period}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={plan.id === 'free'}
                  className={`w-full py-3 rounded-xl font-black transition-all mb-6 ${
                    plan.id === 'free'
                      ? isDark
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isDark
                      ? 'bg-white text-purple-900 hover:bg-gradient-to-r hover:from-purple-400 hover:to-pink-400'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-1 ${feature.included ? 'text-green-500' : isDark ? 'text-white/20' : 'text-gray-300'}`}>
                        {feature.included ? '✓' : '○'}
                      </div>
                      <span
                        className={`text-sm ${
                          feature.included
                            ? isDark
                              ? 'text-white/80'
                              : 'text-gray-700'
                            : isDark
                            ? 'text-white/30 line-through'
                            : 'text-gray-400 line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className={`text-2xl font-black mb-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Common Questions
          </h3>

          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes! Cancel your subscription at any time with no penalties.' },
              { q: 'Is my payment secure?', a: 'We use Razorpay, trusted by millions. Your data is encrypted.' },
              { q: 'What if I have issues?', a: 'Our support team is here to help. Contact us anytime.' },
            ].map((faq, i) => (
              <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Q: {faq.q}</p>
                <p className={isDark ? 'text-white/70' : 'text-gray-600'}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
