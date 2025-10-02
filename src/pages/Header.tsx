// src/pages/Header.tsx
"use client";

import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, X, Sun, Moon } from "lucide-react";

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);
  }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    setIsDark(el.classList.contains("dark"));
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative text-[0.98rem] text-white/90 hover:text-white",
      "after:absolute after:left-0 after:-bottom-[3px] after:h-[2px] after:bg-white",
      isActive ? "after:w-full text-white" : "after:w-0",
      "hover:after:w-full after:transition-all after:duration-200",
    ].join(" ");
  return (
    // ناخد العرض كله: fixed + left-0 right-0 + w-full
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[var(--border-soft)] bg-black">
      {/* شيلت max-width عشان يبقى Full width فعلي */}
      <div className="flex h-14 w-full items-center justify-between px-5">
        {/* Logo */}
        <Link to="/" className="select-none">
          <span className="text-2xl font-bold text-white">
            ONE<span className="font-semibold">klient</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About Us
          </NavLink>
          <NavLink to="/blog" className={linkClass}>
            Blog
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            Contact
          </NavLink>

          {/* أيقونة فقط بدون كلمة Theme */}
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="ml-2 h-9 w-9 border-white/20 bg-transparent p-0 text-white hover:bg-white/10"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </nav>

        {/* Mobile menu trigger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 p-0 text-white hover:bg-white/10"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="top" className="p-0">
              <div className="bg-black px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    ONE<span className="font-semibold">klient</span>
                  </span>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="h-9 w-9 p-0 text-white hover:bg-white/10"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
              </div>

              {/* Dropdown links */}
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg)] py-2">
                <div className="grid">
                  <SheetClose asChild>
                    <NavLink
                      to="/"
                      end
                      className={({ isActive }) =>
                        [
                          "px-5 py-3 text-base",
                          isActive
                            ? "font-semibold text-[var(--text)] underline"
                            : "text-[var(--muted)] hover:text-[var(--text)]",
                        ].join(" ")
                      }
                    >
                      Home
                    </NavLink>
                  </SheetClose>

                  <SheetClose asChild>
                    <NavLink
                      to="/about"
                      className={({ isActive }) =>
                        [
                          "px-5 py-3 text-base",
                          isActive
                            ? "font-semibold text-[var(--text)] underline"
                            : "text-[var(--muted)] hover:text-[var(--text)]",
                        ].join(" ")
                      }
                    >
                      About Us
                    </NavLink>
                  </SheetClose>

                  <SheetClose asChild>
                    <NavLink
                      to="/blog"
                      className={({ isActive }) =>
                        [
                          "px-5 py-3 text-base",
                          isActive
                            ? "font-semibold text-[var(--text)] underline"
                            : "text-[var(--muted)] hover:text-[var(--text)]",
                        ].join(" ")
                      }
                    >
                      Blog
                    </NavLink>
                  </SheetClose>

                  <SheetClose asChild>
                    <NavLink
                      to="/contact"
                      className={({ isActive }) =>
                        [
                          "px-5 py-3 text-base",
                          isActive
                            ? "font-semibold text-[var(--text)] underline"
                            : "text-[var(--muted)] hover:text-[var(--text)]",
                        ].join(" ")
                      }
                    >
                      Contact
                    </NavLink>
                  </SheetClose>

                  <div className="px-5 pb-3 pt-2">
                    {/* أيقونة فقط بدون نص */}
                    <Button
                      variant="outline"
                      onClick={toggleTheme}
                      className="h-9 w-9 border-[var(--border-soft)] bg-transparent p-0 text-[var(--text)] hover:bg-[var(--card)]"
                      aria-label="Toggle theme"
                      title="Toggle theme"
                    >
                      {isDark ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* اختياري: spacer لتفادي تغطية المحتوى لأن الهيدر fixed */}
      <div className="h-0" />
    </header>
  );
}
