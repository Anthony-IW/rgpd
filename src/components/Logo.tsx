import logo from "@/assets/logo.png";

export const Logo = ({ className = "h-10 w-10" }: { className?: string }) => (
  <img src={logo} alt="Informatique & Web - Audit RGPD" className={className} />
);