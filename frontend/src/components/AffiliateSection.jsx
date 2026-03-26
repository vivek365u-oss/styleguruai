// ============================================================
// StyleGuru — Affiliate Product Section
// ============================================================

function getAffiliateLinks(colorName, category, gender) {
  const isFemale = gender === "female";
  const color = colorName.toLowerCase().replace(/\s+/g, "+");

  const catMap = {
    shirt: isFemale ? "women+kurti+top" : "men+formal+shirt",
    dress: "women+dress",
    top: isFemale ? "women+top" : "men+shirt",
    pant: isFemale ? "women+palazzo" : "men+chinos+trousers",
    bottom: isFemale ? "women+palazzo+leggings" : "men+trousers",
    kurti: "women+kurti+cotton",
    lehenga: "women+lehenga+choli",
    saree: "women+saree",
    accessories: isFemale ? "women+jewellery" : "men+accessories+belt",
    belt: "men+leather+belt",
    watch: isFemale ? "women+watch" : "men+watch+formal",
    shoes: isFemale ? "women+heels+sandals" : "men+formal+shoes",
    bag: isFemale ? "women+handbag" : "men+backpack+office+bag",
    wallet: isFemale ? "women+wallet" : "men+leather+wallet",
    sunglasses: isFemale ? "women+sunglasses" : "men+sunglasses+polarized",
  };

  const cat = catMap[category] || (isFemale ? "women+fashion" : "men+fashion");

  return {
    best: {
      label: "🔥 Best Match",
      badge: "Best Pick",
      badgeColor: "bg-gradient-to-r from-purple-600 to-pink-600",
      amazon: `https://www.amazon.in/s?k=${color}+${cat}&sort=review-rank`,
      flipkart: `https://www.flipkart.com/search?q=${color}+${cat.replace(/\+/g, "+")}&sort=popularity`,
      myntra: getMyntraUrl(category, color, isFemale),
      cta: "Buy Now",
      trust: "⭐ Top Rated • Free Delivery",
      urgency: "🔥 Trending Now",
    },
    budget: {
      label: "💰 Budget Pick",
      badge: "Budget",
      badgeColor: "bg-green-600",
      amazon: `https://www.amazon.in/s?k=${color}+${cat}&rh=p_36%3A-100000`,
      flipkart: `https://www.flipkart.com/search?q=${color}+${cat.replace(/\+/g, "+")}&sort=price_asc`,
      myntra: getMyntraUrl(category, color, isFemale) + "&sort=price_asc",
      cta: "Shop Budget",
      trust: "✅ Best Value",
      urgency: "💸 Under ₹999",
    },
    premium: {
      label: "⭐ Premium",
      badge: "Premium",
      badgeColor: "bg-amber-600",
      amazon: `https://www.amazon.in/s?k=premium+${color}+${cat}&sort=review-rank`,
      flipkart: `https://www.flipkart.com/search?q=premium+${color}+${cat.replace(/\+/g, "+")}&sort=popularity`,
      myntra: getMyntraUrl(category, color, isFemale) + "&sort=price_desc",
      cta: "Shop Premium",
      trust: "👑 Premium Quality",
      urgency: "Limited Stock",
    },
  };
}

function getMyntraUrl(category, color, isFemale) {
  const myntraMap = {
    shirt: isFemale ? `https://www.myntra.com/tops?rawQuery=${color}` : `https://www.myntra.com/shirts?rawQuery=${color}`,
    dress: `https://www.myntra.com/dresses?rawQuery=${color}`,
    top: isFemale ? `https://www.myntra.com/tops?rawQuery=${color}` : `https://www.myntra.com/shirts?rawQuery=${color}`,
    pant: isFemale ? `https://www.myntra.com/palazzos?rawQuery=${color}` : `https://www.myntra.com/trousers?rawQuery=${color}`,
    bottom: isFemale ? `https://www.myntra.com/palazzos?rawQuery=${color}` : `https://www.myntra.com/trousers?rawQuery=${color}`,
    kurti: `https://www.myntra.com/kurtas?rawQuery=${color}`,
    lehenga: `https://www.myntra.com/lehenga-cholis?rawQuery=${color}`,
    saree: `https://www.myntra.com/sarees?rawQuery=${color}`,
    shoes: isFemale ? `https://www.myntra.com/heels?rawQuery=${color}` : `https://www.myntra.com/formal-shoes?rawQuery=${color}`,
    watch: `https://www.myntra.com/watches?rawQuery=${color}`,
    bag: isFemale ? `https://www.myntra.com/handbags?rawQuery=${color}` : `https://www.myntra.com/backpacks?rawQuery=${color}`,
    accessories: isFemale ? `https://www.myntra.com/jewellery?rawQuery=${color}` : `https://www.myntra.com/accessories?rawQuery=${color}`,
  };
  return myntraMap[category] || `https://www.myntra.com/fashion?rawQuery=${color}`;
}

function AffiliateCard({ tier, colorName, category, gender }) {
  const links = getAffiliateLinks(colorName, category, gender);
  const t = links[tier];
  const isBest = tier === "best";

  return (
    <div className={`relative rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02] ${
      isBest
        ? "bg-gradient-to-br from-purple-900/60 to-pink-900/40 border-purple-500/50 shadow-lg shadow-purple-900/30"
        : "bg-white/5 border-white/10 hover:border-white/20"
    }`}>
      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${t.badgeColor}`}>
          {t.label}
        </span>
        {isBest && (
          <span className="text-xs text-purple-300 animate-pulse">✨ AI Recommended</span>
        )}
      </div>

      {/* Color preview */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl border border-white/20 flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <span className="text-lg">🛍️</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{colorName}</p>
          <p className="text-white/40 text-xs capitalize">{category}</p>
        </div>
      </div>

      {/* Trust + Urgency */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-green-400 text-xs">{t.trust}</span>
        <span className="text-orange-400 text-xs font-medium">{t.urgency}</span>
      </div>

      {/* Shop buttons */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={t.amazon}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ${
            isBest
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40"
              : "bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30"
          }`}
        >
          🛒 Amazon
        </a>
        <a
          href={t.flipkart}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-xl text-xs font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-all hover:scale-105"
        >
          🏪 Flipkart
        </a>
        <a
          href={t.myntra}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-xl text-xs font-bold bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 transition-all hover:scale-105"
        >
          👗 Myntra
        </a>
      </div>
    </div>
  );
}

export function AffiliateSection({ colorName, category, gender }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Shop This Color</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AffiliateCard tier="best" colorName={colorName} category={category} gender={gender} />
        <AffiliateCard tier="budget" colorName={colorName} category={category} gender={gender} />
        <AffiliateCard tier="premium" colorName={colorName} category={category} gender={gender} />
      </div>
    </div>
  );
}

export default AffiliateSection;
