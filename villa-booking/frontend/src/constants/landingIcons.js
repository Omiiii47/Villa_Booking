import { FaSwimmer, FaUtensils, FaSpa, FaWineBottle, FaUmbrellaBeach, FaPray, FaCompass, FaCamera, FaWineGlassAlt, FaMountain } from 'react-icons/fa';

export const LANDING_ICONS = {
  FaSwimmer,
  FaUtensils,
  FaSpa,
  FaWineBottle,
  FaUmbrellaBeach,
  FaPray,
  FaCompass,
  FaCamera,
  FaWineGlassAlt,
  FaMountain,
};

export const LANDING_ICON_NAMES = Object.keys(LANDING_ICONS);

export const getLandingIcon = (name) => LANDING_ICONS[name] || FaSpa;
