import { buildMyntraUrl, buildMyntraSearchUrl } from './myntraUrl';

const AMAZON_TAG = 'StyleGuruAI-21';

/**
 * Builds a search URL for different e-commerce platforms.
 */
export const PRODUCT_LABEL_MAP = {
  shirt: { male: 'casual shirt', female: 'top' },
  tshirt: { male: 't-shirt', female: 't-shirt' },
  top: { male: 't-shirt', female: 'top' },
  pant: { male: 'trouser', female: 'trouser' },
  cargo: { male: 'cargo pants', female: 'cargo pants' },
  bottom: { male: 'trouser', female: 'trouser' },
  kurta: { male: 'kurta', female: 'kurti' },
  kurti: { male: 'kurta', female: 'kurti' },
  dress: { male: 'shirt', female: 'dress' },
  lehenga: { male: 'kurta', female: 'lehenga' },
  saree: { male: 'kurta', female: 'saree' },
  sharara: { male: 'kurta', female: 'sharara suit' },
  suit: { male: 'suit', female: 'suit' },
  dupatta: { male: 'scarf', female: 'dupatta' },
  hoodie: { male: 'hoodie', female: 'hoodie' },
  sweatshirt: { male: 'sweatshirt', female: 'sweatshirt' },
  blazer: { male: 'blazer', female: 'blazer' },
  formal_shirt: { male: 'formal shirt', female: 'formal shirt' },
  accessory: { male: 'accessory', female: 'accessory' },
  makeup: { male: 'makeup', female: 'makeup' },
  shoes: { male: 'sneakers', female: 'heels' },
  sneakers: { male: 'sneakers', female: 'sneakers' },
  heels: { male: 'formal shoes', female: 'heels' },
  watch: { male: 'watch', female: 'watch' },
  handbag: { male: 'backpack', female: 'handbag' },
  necklace: { male: 'chain', female: 'necklace' },
  earrings: { male: 'studs', female: 'earrings' },
  bangles: { male: 'bracelet', female: 'bangles' },
};

/**
 * Standardizes shopping metadata for rich deep-linking.
 */
export const getShopData = ({ query, catId, color, gender }) => {
  const isFemale = gender?.toLowerCase().includes('female') || gender === 'women';
  const gKey = isFemale ? 'female' : 'male';
  
  const finalCatId = (catId || 'shirt').toLowerCase().replace(/^cat_/, '');
  const productLabel = PRODUCT_LABEL_MAP[finalCatId]?.[gKey] || finalCatId;
  
  return {
    query: query || (color ? `${color} ${productLabel}` : productLabel),
    catId: finalCatId,
    color: color || '',
    gender: gKey,
  };
};

export const buildShopUrl = (item, storeId, gender = 'male', budget = null) => {
  const isObj = typeof item === 'object' && item !== null;
  const queryStr = isObj ? (item.query || '') : item;
  const color = isObj ? (item.color || '') : '';
  const catId = isObj ? (item.catId || '') : '';
  
  const gKey = gender.toLowerCase().includes('female') ? 'female' : 'male';
  const gStr = gKey === 'female' ? 'women' : 'men';
  const cleanItem = (queryStr || '').trim();
  const encodedQ = encodeURIComponent(cleanItem);
  const qWithGender = encodeURIComponent(`${cleanItem} ${gStr}`);

  // Budget logic (if supported)
  const amzPrice = budget ? `%2Cp_36%3A-${budget * 100}` : '';
  const fkPrice = budget ? `&p%5B%5D=facets.price_range.from%3D0&p%5B%5D=facets.price_range.to%3D${budget}` : '';

  switch (storeId) {
    case 'myntra':
      // If we have rich data, use the DEEP builder. Otherwise use Search fallback.
      if (isObj && (catId || color)) {
        return buildMyntraUrl({ color, catId, gender: gKey, itemType: catId });
      }
      return buildMyntraSearchUrl(cleanItem, gKey);
    case 'amazon':
      return `https://www.amazon.in/s?k=${qWithGender}${amzPrice}&tag=${AMAZON_TAG}`;
    case 'flipkart':
      return `https://www.flipkart.com/search?q=${qWithGender}${fkPrice}`;
    case 'meesho':
      return `https://www.meesho.com/search?q=${qWithGender}`;
    case 'ajio':
      return `https://www.ajio.com/search/?text=${qWithGender}`;

    // Men Specific
    case 'tatacliq':
      return `https://www.tatacliq.com/search/?searchCategory=all&text=${encodedQ}`;
    case 'snitch':
      return `https://www.snitch.co.in/search?q=${encodedQ}`;
    case 'powerlook':
      return `https://www.powerlook.in/search?q=${encodedQ}`;
    case 'souledstore':
      return `https://www.thesouledstore.com/search?q=${encodedQ}`;
    case 'beyoung':
      return `https://www.beyoung.in/search?q=${encodedQ}`;

    // Women Specific
    case 'nykaafashion':
      return `https://www.nykaafashion.com/catalogsearch/result/?q=${encodedQ}`;
    case 'urbanic':
      return `https://www.urbanic.com/search/${encodedQ}`;
    case 'berrylush':
      return `https://www.berrylush.com/search?q=${encodedQ}`;
    case 'libas':
      return `https://www.libas.in/search?q=${encodedQ}`;
    case 'sassafras':
      return `https://sassafras.in/search?q=${encodedQ}`;

    default:
      return `https://www.google.com/search?q=${qWithGender}`;
  }
};

export const COMMON_STORES = [
  { id: 'myntra', name: 'Myntra', emoji: '🎀', domain: 'myntra.com', color: '#f13ab1', bg: 'linear-gradient(135deg, #f13ab1, #f87171)' },
  { id: 'meesho', name: 'Meesho', emoji: '💸', domain: 'meesho.com', color: '#ff44af', bg: 'linear-gradient(135deg, #ff44af, #ff8c00)' },
  { id: 'ajio', name: 'Ajio', emoji: '🏢', domain: 'ajio.com', color: '#2c3e50', bg: 'linear-gradient(135deg, #2c3e50, #bdc3c7)' },
  { id: 'flipkart', name: 'Flipkart', emoji: '🛒', domain: 'flipkart.com', color: '#2874f0', bg: 'linear-gradient(135deg, #2874f0, #0052cc)' },
  { id: 'amazon', name: 'Amazon', emoji: '📦', domain: 'amazon.in', color: '#ff9900', bg: 'linear-gradient(135deg, #ff9900, #232f3e)' },
];

export const MALE_STORES = [
  { id: 'tatacliq', name: 'Tata CLiQ', emoji: '👔', domain: 'tatacliq.com', color: '#da1c5c', bg: 'linear-gradient(135deg, #da1c5c, #000)' },
  { id: 'snitch', name: 'Snitch', emoji: '⚡', domain: 'snitch.co.in', color: '#000000', bg: 'linear-gradient(135deg, #333, #000)' },
  { id: 'powerlook', name: 'Powerlook', emoji: '😎', domain: 'powerlook.in', color: '#ffcc00', bg: 'linear-gradient(135deg, #ffcc00, #333)' },
  { id: 'souledstore', name: 'Souled Store', emoji: '🎈', domain: 'thesouledstore.com', color: '#e11b22', bg: 'linear-gradient(135deg, #e11b22, #000)' },
  { id: 'beyoung', name: 'Beyoung', emoji: '🛹', domain: 'beyoung.in', color: '#42a2a2', bg: 'linear-gradient(135deg, #42a2a2, #2c3e50)' },
];

export const FEMALE_STORES = [
  { id: 'nykaafashion', name: 'Nykaa Fashion', emoji: '💄', domain: 'nykaa.com', color: '#fc2779', bg: 'linear-gradient(135deg, #fc2779, #ff5e9a)' },
  { id: 'urbanic', name: 'Urbanic', emoji: '✨', domain: 'urbanic.com', color: '#ff3b30', bg: 'linear-gradient(135deg, #ff3b30, #000)' },
  { id: 'berrylush', name: 'Berrylush', emoji: '🍃', domain: 'berrylush.com', color: '#2ecc71', bg: 'linear-gradient(135deg, #2ecc71, #27ae60)' },
  { id: 'libas', name: 'Libas', emoji: '🥻', domain: 'libas.in', color: '#8e44ad', bg: 'linear-gradient(135deg, #8e44ad, #2c3e50)' },
  { id: 'sassafras', name: 'Sassafras', emoji: '👗', domain: 'sassafras.in', color: '#f39c12', bg: 'linear-gradient(135deg, #f39c12, #e67e22)' },
];
