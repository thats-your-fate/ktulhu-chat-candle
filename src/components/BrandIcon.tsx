type BrandIconProps = {
  name: "google" | "apple" | "facebook";
  size?: number;
  className?: string;
};

export const BrandIcon: React.FC<BrandIconProps> = ({
  name,
  size = 20,
  className = "",
}) => {
  return (
    <img
      src={`/authBrands/${name}.svg`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={className}
    />
  );
};
