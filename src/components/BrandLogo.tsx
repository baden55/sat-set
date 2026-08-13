import logo from "@/assets/guru-satset-logo.png.asset.json";

export function BrandLogo({ className = "size-10" }: { className?: string }) {
  return <img src={logo.url} alt="Logo Guru Satset" className={`${className} object-contain`} />;
}