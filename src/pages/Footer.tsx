// src/pages/Footer.tsx
import { Link } from "react-router-dom";
import { FiPhone, FiMapPin, FiSend } from "react-icons/fi";

export default function Footer() {
  const year = new Date().getFullYear();
  const link = "text-white/70 hover:text-white hover:underline transition-colors";

  return (
    <footer className="mt-auto w-full bg-black text-white">
      {/* ↓ قللنا التباعد: pt-8 pb-6 بدل مسافات كبيرة */}
      <div className="w-full px-6 pt-8 pb-6">
        {/* ↓ جريد مضغوط */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">SERVICES</h4>
            <ul className="grid gap-1.5">
              <li><a className={link} href="/#service-web">Web Design &amp; Development</a></li>
              <li><a className={link} href="/#service-wordpress">WordPress</a></li>
              <li><a className={link} href="/#service-seo">SEO &amp; Growth</a></li>
              <li><a className={link} href="/#service-marketing">Digital Marketing</a></li>
              <li><a className={link} href="/#service-security">Performance &amp; Security</a></li>
              <li><a className={link} href="/#service-support">Maintenance &amp; Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">COMPANY</h4>
            <ul className="grid gap-1.5">
              <li><Link className={link} to="/about#about-top">About</Link></li>
              <li><Link className={link} to="/about#about-values">Values</Link></li>
              <li><Link className={link} to="/blog">Blog</Link></li>
              <li><Link className={link} to="/contact#contact-info">Contact Info</Link></li>
              <li><Link className={link} to="/contact#contact-form">Contact Form</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide">QUICK LINKS</h4>
            <ul className="grid gap-1.5">
              <li><Link className={link} to="/">Home</Link></li>
              <li><a className={link} href="/#services">All Services</a></li>
              <li><Link className={link} to="/blog">Latest Posts</Link></li>
              <li><Link className={link} to="/contact">Get a Quote</Link></li>
            </ul>
          </div>

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
                <Link className={`${link} inline-flex items-center gap-2`} to="/contact#contact-form">
                  <FiSend className="h-4 w-4 text-white/90" /> Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* خط سفلي + سطر الحقوق في السنتر بدون مسافات زيادة */}
        <div className="mt-6 border-t border-white/10 pt-3">
          <p className="text-center text-sm text-white/70">
            © {year} ONEKlient. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
