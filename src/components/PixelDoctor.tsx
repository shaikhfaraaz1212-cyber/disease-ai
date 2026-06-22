import React from "react";

interface PixelDoctorProps {
  className?: string;
  animating?: boolean;
}

export const PixelDoctor: React.FC<PixelDoctorProps> = ({ className = "", animating = false }) => {
  return (
    <div className={`relative select-none ${className}`}>
      {/* 2D pixel doctor illustration composed of perfect crisp SVG rect panels */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full pixelated ${animating ? "animate-bounce" : ""}`}
        style={{ animationDuration: "2s" }}
      >
        {/* Shadow */}
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0, 0, 0, 0.1)" />

        {/* Hair - Dark Blue-Grey pixel style */}
        <rect x="22" y="10" width="20" height="4" fill="#3A3C52" />
        <rect x="20" y="14" width="24" height="4" fill="#3A3C52" />
        <rect x="18" y="18" width="28" height="6" fill="#3A3C52" />
        
        {/* Doctor Cap/Band */}
        <rect x="20" y="18" width="24" height="4" fill="#5A67FF" />
        {/* Head Mirror Reflector - Metal Steel Circle */}
        <rect x="30" y="15" width="4" height="4" fill="#E2E8F0" />
        <rect x="31" y="16" width="2" height="2" fill="#8B9DFF" />

        {/* Skin Tone */}
        <rect x="22" y="24" width="20" height="12" fill="#FFDBB5" />
        <rect x="20" y="28" width="2" height="6" fill="#FFDBB5" />
        <rect x="42" y="28" width="2" height="6" fill="#FFDBB5" />

        {/* Cheeks - Cute Retro Pink Pixels */}
        <rect x="24" y="30" width="2" height="2" fill="#FF8B8B" />
        <rect x="38" y="30" width="2" height="2" fill="#FF8B8B" />

        {/* Eyes - Retro Glasses */}
        <rect x="24" y="26" width="6" height="4" fill="#FFFFFF" />
        <rect x="34" y="26" width="6" height="4" fill="#FFFFFF" />
        <rect x="26" y="27" width="2" height="2" fill="#222222" />
        <rect x="36" y="27" width="2" height="2" fill="#222222" />
        <rect x="30" y="27" width="4" height="2" fill="#5A67FF" /> {/* メガネのブリッジ */}

        {/* Smile */}
        <rect x="30" y="33" width="4" height="2" fill="#E53E3E" />

        {/* Lab Coat / Clothes */}
        <rect x="16" y="36" width="32" height="20" fill="#EDF2F7" />
        {/* Shirt - Teal Blue */}
        <rect x="30" y="36" width="4" height="8" fill="#319795" />
        <rect x="28" y="36" width="2" height="4" fill="#319795" />
        <rect x="34" y="36" width="2" height="4" fill="#319795" />

        {/* Red Cross Badge */}
        <rect x="38" y="42" width="6" height="6" fill="#FFEDED" />
        <rect x="40" y="41" width="2" height="8" fill="#E53E3E" />
        <rect x="37" y="44" width="8" height="2" fill="#E53E3E" />

        {/* Stethoscope around neck */}
        <rect x="24" y="36" width="2" height="12" fill="#A0AEC0" />
        <rect x="38" y="36" width="2" height="8" fill="#A0AEC0" />
        <rect x="26" y="46" width="12" height="2" fill="#A0AEC0" />
        {/* Chest piece */}
        <rect x="31" y="46" width="2" height="4" fill="#4A5568" />
        <rect x="30" y="50" width="4" height="2" fill="#E2E8F0" />

        {/* Shadow accents on arms */}
        <rect x="14" y="38" width="2" height="14" fill="#CBD5E0" />
        <rect x="48" y="38" width="2" height="14" fill="#CBD5E0" />
      </svg>
    </div>
  );
};
export default PixelDoctor;
