import React from 'react';
import { 
  FiShoppingBag, 
  FiCamera, 
  FiDroplet, 
  FiGrid, 
  FiHeart, 
  FiStar, 
  FiGlobe, 
  FiUser, 
  FiSettings, 
  FiTarget, 
  FiSearch,
  FiZap,
  FiWatch,
  FiBriefcase,
  FiSun,
  FiCloudRain,
  FiCloud,
  FiCloudSnow,
  FiSmile
} from 'react-icons/fi';
import { 
  GiDress, 
  GiShirt, 
  GiTrousers, 
  GiHighHeel, 
  GiNecklace,
  GiSombrero,
  GiRunningShoe,
  GiHoodie,
  GiSunglasses,
  GiBilledCap
} from 'react-icons/gi';

export const FashionIcons = {
  // Category Icons
  Dress: GiDress,
  Shirt: GiShirt,
  Trousers: GiTrousers,
  Heels: GiHighHeel,
  Jewelry: GiNecklace,
  Hat: GiSombrero,
  Shoes: GiRunningShoe,
  Hoodie: GiHoodie,
  Accessories: GiSunglasses,
  Watch: FiWatch,
  Cap: GiBilledCap,
  
  // Feature Icons
  Analysis: FiZap,
  Camera: FiCamera,
  Global: FiGlobe,
  Star: FiStar,
  Wardrobe: FiGrid,
  Shopping: FiShoppingBag,
  Search: FiSearch,
  Accuracy: FiTarget,
  AI: FiZap,
  Formal: FiBriefcase,
  
  // Weather & States
  Sun: FiSun,
  Rain: FiCloudRain,
  Cloud: FiCloud,
  Snow: FiCloudSnow,
  Happy: FiSmile,
  
  // UI
  User: FiUser,
  Settings: FiSettings,
  Heart: FiHeart,
  Bulb: FiSun
};

export const IconRenderer = ({ icon: Icon, className = "w-full h-full", ...props }) => {
  if (!Icon) return null;
  return <Icon className={className} {...props} />;
};
