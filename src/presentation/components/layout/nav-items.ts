import {
  LayoutDashboard,
  Bitcoin,
  TrendingUp,
  Landmark,
  HandCoins,
  PiggyBank,
  Building2,
  Home,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cripto", label: "Cripto", icon: Bitcoin },
  { to: "/bolsa", label: "Bolsa", icon: TrendingUp },
  { to: "/finsus", label: "Finsus", icon: Landmark },
  { to: "/yotepresto", label: "YoTePresto", icon: HandCoins },
  { to: "/afore", label: "AFORE", icon: PiggyBank },
  { to: "/infonavit", label: "Infonavit", icon: Building2 },
  { to: "/casa", label: "Casa", icon: Home },
  { to: "/cuentas", label: "Cuentas", icon: Wallet },
];
