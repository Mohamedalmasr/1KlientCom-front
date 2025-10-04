// src/pages/Footer.tsx
import { useNavigate } from "react-router-dom";
import { FiPhone, FiMapPin, FiSend } from "react-icons/fi";

export default function Footer() {
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const link = "text-white/70 hover:text-white hover:underline transition-colors";

  // helper: يروح للـ Home ومعاه state يحدد السيكشن المطلوب
  const goToHomeSection = (section: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/", { state: { scrollTo: section } });
  };

  return (
    <footer className="mt-auto w-full bg-black text-white">
      <div className="w-full px-6 pt-8 pb-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* SERVICES */}
          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">SERVICES</h4>
            <ul className="grid gap-1.5">
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>Web Design &amp; Development</a></li>
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>WordPress</a></li>
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>SEO &amp; Growth</a></li>
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>Digital Marketing</a></li>
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>Performance &amp; Security</a></li>
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>Maintenance &amp; Support</a></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">COMPANY</h4>
            <ul className="grid gap-1.5">
              <li><a className={link} href="/about">About</a></li>
              <li><a className={link} href="/blog">Blog</a></li>
              <li><a className={link} href="/contact">Contact </a></li>
            </ul>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">QUICK LINKS</h4>
            <ul className="grid gap-1.5">
              <li><a className={link} href="/">Home</a></li>
              <li><a className={link} href="/" onClick={goToHomeSection("services")}>All Services</a></li>
              <li><a className={link} href="/blog">Latest Posts</a></li>
              <li><a className={link} href="/contact">Get a Quote</a></li>
            </ul>
          </div>

          {/* CONTACTS */}
          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">CONTACTS</h4>
            <ul className="grid gap-2">
              <li>
                <a className={`${link} inline-flex items-center gap-2`} href="tel:+15064764968">
                  <FiPhone className="h-4 w-4 text-white/90" /> +1 506 476 4968
                </a>
              </li>
              <li>
                <a
                  className={`${link} inline-flex items-start gap-2`}
                  href="https://maps.google.com/?q=186+Whittaker+Settlement+Road,+Hoyt+NB+Canada"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiMapPin className="mt-0.5 h-4 w-4 text-white/90" />
                  186 Whittaker Settlement Road, Hoyt NB
                </a>
              </li>
              <li>
                <a className={`${link} inline-flex items-center gap-2`} href="/contact#contact-form">
                  <FiSend className="h-4 w-4 text-white/90" /> Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator + Copyright */}
        <div className="mt-6 border-t border-white/10 pt-3">
          <p className="text-center text-sm text-white/70">
            © {year} ONEKlient. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
