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
  FiCloudRain
} from 'react-icons/fi';
import { 
  GiDress, 
  GiShirt, 
  GiTrousers, 
  GiHighHeel, 
  GiNecklace,
  GiLargeHat,
  GiRunningShoe,
  GiManualHoodie,
  GiSunglasses
} from 'react-icons/gi';

export const FashionIcons = {
  // Category Icons
  Dress: GiDress,
  Shirt: GiShirt,
  Trousers: GiTrousers,
  Heels: GiHighHeel,
  Jewelry: GiNecklace,
  Hat: GiLargeHat,
  Shoes: GiRunningShoe,
  Hoodie: GiManualHoodie,
  Accessories: GiSunglasses,
  Watch: FiWatch,
  
  // Feature Icons
  Analysis: FiDroplet,
  Camera: FiCamera,
  Global: FiGlobe,
  Star: FiStar,
  Wardrobe: FiGrid,
  Shopping: FiShoppingBag,
  Search: FiSearch,
  Accuracy: FiTarget,
  AI: FiZap,
  Formal: FiBriefcase,
  
  // Weather
  Sun: FiSun,
  Rain: FiCloudRain,
  
  // UI
  User: FiUser,
  Settings: FiSettings,
  Heart: FiHeart
};

export const IconRenderer = ({ icon: Icon, className = "w-full h-full", ...props }) => {
  if (!Icon) return null;
  return <Icon className={className} {...props} />;
};
