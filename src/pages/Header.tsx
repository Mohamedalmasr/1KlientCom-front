"use client";

import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, X, Sun, Moon } from "lucide-react";

// NEW: dropdown & avatar
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AUTH_KEY, loadAuth, clearAuth, type AuthUser } from "@/lib/auth";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const lastY = useRef(0);
  const ticking = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);
  }, []);

  // Load auth once + subscribe to changes
  useEffect(() => {
    const updateAuthFromStorage = () => {
      const auth = loadAuth();
      setUser(auth?.user ?? null);
    };
    updateAuthFromStorage();

    const onStorage = (e: StorageEvent | Event) => {
      // fires on other tabs (storage) OR same tab (ok-auth-change)
      if (e instanceof StorageEvent) {
        if (e.key === AUTH_KEY) updateAuthFromStorage();
      } else {
        // custom event
        updateAuthFromStorage();
      }
    };

    window.addEventListener("storage", onStorage as any);
    window.addEventListener("ok-auth-change", onStorage as any);
    return () => {
      window.removeEventListener("storage", onStorage as any);
      window.removeEventListener("ok-auth-change", onStorage as any);
    };
  }, []);

  // Hide-on-scroll behavior
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 4);

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const goingDown = current > lastY.current;
          const dist = Math.abs(current - lastY.current);

          if (current <= 8) {
            setHidden(false);
          } else {
            if (goingDown && dist > 4) setHidden(true);
            else if (!goingDown && dist > 2) setHidden(false);
          }

          lastY.current = current;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    setIsDark(el.classList.contains("dark"));
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/"); // اختياري
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative text-[0.98rem]",
      "text-slate-900/80 hover:text-slate-900",
      "dark:text-white/90 dark:hover:text-white",
      "after:absolute after:left-0 after:-bottom-[6px] after:h-[2px] after:bg-current",
      isActive ? "after:w-full" : "after:w-0",
      "hover:after:w-full after:transition-all after:duration-200",
    ].join(" ");

  // Helper لعرض حروف الاسم في AvatarFallback
  const initials = user?.name
    ?.split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 w-full",
        "transition-transform duration-300 will-change-transform",
        hidden ? "-translate-y-full" : "translate-y-0",
        "backdrop-blur-md",
        scrolled
          ? "bg-white/75 border-b border-black/10 shadow-sm dark:bg-black/60 dark:border-white/10"
          : "bg-white/70 border-b border-black/10 dark:bg-black/50 dark:border-white/10",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5">
        {/* Logo */}
        <Link to="/" className="select-none" aria-label="ONEklient Home">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            ONE<span className="font-semibold">klient</span>
          </span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={linkClass} end>Home</NavLink>
          <NavLink to="/about" className={linkClass}>About Us</NavLink>
          <NavLink to="/blog" className={linkClass}>Blog</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>

          {/* Right side: either Login or User menu */}
          {!user ? (
            <>
              <Button
                asChild
                className={[
                  "ml-2 h-9 rounded-full px-4 font-medium",
                  "shadow-sm border border-black/20 hover:shadow",
                  "dark:border-white/20",
                ].join(" ")}
                aria-label="Log in"
                title="Log in"
              >
                <Link to="/admin/login">Log in</Link>
              </Button>
              <Button
                variant="outline"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title="Toggle theme"
                className={[
                  "ml-2 h-9 w-9 p-0 rounded-full bg-transparent",
                  "border-black/20 text-slate-900 hover:bg-black/5",
                  "dark:border-white/20 dark:text-white dark:hover:bg-white/10",
                ].join(" ")}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <>
              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Open account menu"
                  >
                    <Avatar className="h-8 w-8">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                      ) : (
                        <AvatarFallback>{initials || "U"}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="max-w-[140px] truncate text-sm font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    Signed in as {user.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/dashboard">Open Admin</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme toggle */}
              <Button
                variant="outline"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title="Toggle theme"
                className={[
                  "ml-1 h-9 w-9 p-0 rounded-full bg-transparent",
                  "border-black/20 text-slate-900 hover:bg-black/5",
                  "dark:border-white/20 dark:text-white dark:hover:bg-white/10",
                ].join(" ")}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 p-0 text-slate-900 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="top"
              className={["p-0 border-0", "bg-white/90 dark:bg-black/80 backdrop-blur-md"].join(" ")}
            >
              {/* Header inside sheet */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-black/60 backdrop-blur">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  ONE<span className="font-semibold">klient</span>
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="h-9 w-9 rounded-full border-black/20 bg-transparent p-0 text-slate-900 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>

                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="h-9 w-9 p-0 text-slate-900 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
              </div>

              {/* Links */}
              <nav className="max-h-[calc(100dvh-60px)] overflow-y-auto">
                <ul className="divide-y divide-black/10 dark:divide-white/10">
                  <li>
                    <SheetClose asChild>
                      <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                          [
                            "block px-5 py-4 text-lg",
                            "text-slate-800 hover:text-slate-950",
                            "dark:text-white/85 dark:hover:text-white",
                            isActive ? "font-semibold underline" : "",
                          ].join(" ")
                        }
                      >
                        Home
                      </NavLink>
                    </SheetClose>
                  </li>

                  <li>
                    <SheetClose asChild>
                      <NavLink
                        to="/about"
                        className={({ isActive }) =>
                          [
                            "block px-5 py-4 text-lg",
                            "text-slate-800 hover:text-slate-950",
                            "dark:text-white/85 dark:hover:text-white",
                            isActive ? "font-semibold underline" : "",
                          ].join(" ")
                        }
                      >
                        About Us
                      </NavLink>
                    </SheetClose>
                  </li>

                  <li>
                    <SheetClose asChild>
                      <NavLink
                        to="/blog"
                        className={({ isActive }) =>
                          [
                            "block px-5 py-4 text-lg",
                            "text-slate-800 hover:text-slate-950",
                            "dark:text-white/85 dark:hover:text-white",
                            isActive ? "font-semibold underline" : "",
                          ].join(" ")
                        }
                      >
                        Blog
                      </NavLink>
                    </SheetClose>
                  </li>

                  <li>
                    <SheetClose asChild>
                      <NavLink
                        to="/contact"
                        className={({ isActive }) =>
                          [
                            "block px-5 py-4 text-lg",
                            "text-slate-800 hover:text-slate-950",
                            "dark:text-white/85 dark:hover:text-white",
                            isActive ? "font-semibold underline" : "",
                          ].join(" ")
                        }
                      >
                        Contact
                      </NavLink>
                    </SheetClose>
                  </li>

                  {/* Mobile footer action: Login OR Admin */}
                  {!user ? (
                    <li className="px-5 py-4">
                      <SheetClose asChild>
                        <Link to="/admin/login" aria-label="Log in">
                          <Button className="w-full rounded-full h-10 font-medium shadow-sm">
                            Log in
                          </Button>
                        </Link>
                      </SheetClose>
                    </li>
                  ) : (
                    <li className="px-5 py-4">
                      <SheetClose asChild>
                        <Link to="/admin/dashboard" aria-label="Open Admin">
                          <Button className="w-full rounded-full h-10 font-medium shadow-sm">
                            Open Admin
                          </Button>
                        </Link>
                      </SheetClose>

                      <div className="mt-3 flex items-center gap-3 px-1">
                        <Avatar className="h-8 w-8">
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                          ) : (
                            <AvatarFallback>{initials || "U"}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                          {user.name}
                        </span>
                        <Button variant="ghost" className="ml-auto h-8 px-3" onClick={handleLogout}>
                          Log out
                        </Button>
                      </div>
                    </li>
                  )}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="h-0" />
    </header>
  );
}
