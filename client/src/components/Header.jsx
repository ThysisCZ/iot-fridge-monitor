import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Menu, X, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition hover:text-blue-600 ${
      isActive ? "text-blue-600" : "text-gray-700"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Burger */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <button
          onClick={() => navigate("/fridges")}
          className="text-xl font-semibold text-gray-800"
        >
          FridgeMonitor
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/fridges" className={navLinkClass}>
            Fridges
          </NavLink>
          <NavLink to="/gateways" className={navLinkClass}>
            Gateways
          </NavLink>
          <NavLink to="/user" className={navLinkClass}>
            User
          </NavLink>
        </nav>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100">
              <UserCircle size={24} />
              <span className="hidden text-sm font-medium md:block">
                {user.name}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <div className="border-b px-3 py-2 text-sm text-gray-600">
              {user.email}
            </div>

            <DropdownMenuItem onClick={() => navigate("/user")}>
              User page
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="border-t bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink
              to="/fridges"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Fridges
            </NavLink>

            <NavLink
              to="/gateways"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Gateways
            </NavLink>

            <NavLink
              to="/user"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              User
            </NavLink>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;