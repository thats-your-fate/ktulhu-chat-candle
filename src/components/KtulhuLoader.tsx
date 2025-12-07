import React from "react";

type Props = {
  size?: number;
  className?: string;
};

export const KtulhuLoader: React.FC<Props> = ({
  size = 40,
  className = ""
}) => {
  return (
    <img
      src="/ktulhuDark.svg"
      alt="Ktulhu Logo"
      width={size}
      height={size}
      className={`
        animate-ktulhuAppear
        ${className}
      `}
      style={{
        animationFillMode: "both",
      }}
      onAnimationEnd={(e) => {
        // After the "pop" animation finishes → switch to soft pulse
        e.currentTarget.classList.add("animate-pulse");
      }}
    />
  );
};
