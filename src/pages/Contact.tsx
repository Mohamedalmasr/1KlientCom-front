
import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ⬅️ استدعاء API
import { sendContact, ApiError, type ContactPayload } from "@/lib/api";

type ServiceKey = "webdesign" | "wordpress" | "seo" | "marketing";

const SERVICE_OPTIONS: { id: ServiceKey; label: string }[] = [
  { id: "webdesign", label: "Web Design & Dev" },
  { id: "wordpress", label: "WordPress" },
  { id: "seo", label: "SEO" },
  { id: "marketing", label: "Marketing" },
];

const SERVICES_INITIAL_STATE: Record<ServiceKey, boolean> = {
  webdesign: false,
  wordpress: false,
  seo: false,
  marketing: false,
};

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [budget, setBudget] = useState<ContactPayload["budget"]>();
  const [services, setServices] = useState<Record<ServiceKey, boolean>>({
    ...SERVICES_INITIAL_STATE,
  });

  const resetFormState = () => {
    setBudget(undefined);
    setServices({ ...SERVICES_INITIAL_STATE });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSent(false);
    setLoading(true);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      const payload: ContactPayload = {
        fstname: String(fd.get("fstname") ?? "").trim(),
        lstname: String(fd.get("lstname") ?? "").trim(),
        phone: String(fd.get("phone") ?? "").trim(),
        email: String(fd.get("email") ?? "").trim() || undefined,
        budget: budget ?? undefined,
        webdesign: services.webdesign,
        wordpress: services.wordpress,
        seo: services.seo,
        marketing: services.marketing,
        msg: String(fd.get("msg") ?? "").trim() || undefined,
      };

      await sendContact(payload);

      setSent(true);
      form.reset();
      resetFormState();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : "Something went wrong while sending your message.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[70vh] bg-background py-10 text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 px-5 lg:grid-cols-3">
        <Card id="contact-info" className="self-start bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground">Get in touch</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div className="text-muted-foreground">
                  <div className="font-semibold text-foreground">Email</div>
                  <a className="hover:underline" href="mailto:info@oneklient.com">
                    info@oneklient.com
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-primary" />
                <div className="text-muted-foreground">
                  <div className="font-semibold text-foreground">Phone</div>
                  <a className="hover:underline" href="tel:+15064764968">
                    +1 506 476 4968
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div className="text-muted-foreground">
                  <div className="font-semibold text-foreground">Office</div>
                  <a
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.google.com/maps/search/?api=1&query=186%20Whittaker%20Settlement%20Road%2C%20Hoyt%20NB"
                  >
                    186 Whittaker Settlement Road, Hoyt NB
                  </a>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card id="contact-form" className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Contact details</CardTitle>
          </CardHeader>

          <CardContent>
            {sent && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <p>Thank you! Your message has been sent. We’ll get back to you shortly.</p>
              </div>
            )}
            {err && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
                {err}
              </div>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fstname">First name</Label>
                  <Input
                    id="fstname"
                    name="fstname"
                    placeholder="John"
                    required
                    className="bg-card text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lstname">Last name</Label>
                  <Input
                    id="lstname"
                    name="lstname"
                    placeholder="Doe"
                    required
                    className="bg-card text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    spellCheck={false}
                    maxLength={254}
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                    title="Enter a valid email, e.g. name@example.com"
                    className="bg-card text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (___) ___-____"
                    required
                    className="bg-card text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="budget">Budget</Label>
                  <Select
                    value={budget}
                    onValueChange={(value) =>
                      setBudget(value as ContactPayload["budget"])
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="budget"
                      className="w-full h-11 rounded-lg bg-card text-foreground border border-border data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    >
                      <SelectValue placeholder="Select a range" />
                    </SelectTrigger>

                    <SelectContent className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md">
                      <SelectItem value="under-2k">Under $2,000</SelectItem>
                      <SelectItem value="2k-5k">$2,000 – $5,000</SelectItem>
                      <SelectItem value="5k-10k">$5,000 – $10,000</SelectItem>
                      <SelectItem value="10k-plus">$10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Services</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <label
                      key={s.id}
                      htmlFor={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                    >
                      <Checkbox
                        id={s.id}
                        name={s.id}
                        checked={services[s.id]}
                        onCheckedChange={(checked) =>
                          setServices((prev) => ({
                            ...prev,
                            [s.id]: checked === true,
                          }))
                        }
                        disabled={loading}
                      />
                      <span className="font-medium text-foreground">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="msg">Your Message</Label>
                <Textarea
                  id="msg"
                  name="msg"
                  rows={5}
                  placeholder="Tell us a bit about your project..."
                  className="bg-card text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
