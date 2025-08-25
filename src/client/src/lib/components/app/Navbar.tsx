import { Link, useLocation } from "@tanstack/react-router";
import { Image } from "../custom/Image";
import { Button } from "../ui/button";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 gap-2 h-[var(--navbar-height)] w-full z-50 border-b bg-background flex items-center justify-between px-4">
      {/* top left */}
      <Link to="/" className="flex gap-2 items-center">
        <Image src="/static/images/logo.png" alt="Sei Trader" className="size-12" />
        <span className="text-3xl tracking-tight font-semibold text-primary">sei trader</span>
      </Link>

      <div className="flex gap-2 items-center">
        <Button variant="primary" size="sm" asChild>
          <Link to="/faucet">
            Faucet
          </Link>
        </Button>
      </div>
    </nav>
  )
}