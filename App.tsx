import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiCheck,
  FiArrowRight,
  FiStar,
  FiInstagram,
  FiTwitter,
  FiYoutube,
  FiPhoneCall,
  FiAward,
  FiTrendingUp,
  FiTarget,
  FiMail,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";

// --- Shared Components ---

const PrimaryButton = ({
  children,
  className = "",
  onClick = () => {},
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 ${className}`}
  >
    {children}
  </button>
);

const SectionTitle = ({
  subtitle,
  title,
  centered = true,
}: {
  subtitle: string;
  title: string;
  centered?: boolean;
}) => (
  <div className={`mb-12 ${centered ? "text-center" : ""}`}>
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-emerald-500 font-bold tracking-[0.2em] uppercase text-xs"
    >
      {subtitle}
    </motion.span>
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-4xl md:text-5xl lg:text-6xl font-black mt-4 leading-tight tracking-tighter"
    >
      {title}
    </motion.h2>
  </div>
);

// --- Smooth scrolling helpers ---

function smoothScrollToHash(hash: string) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useScrollProgressBySections(sectionIds: string[]) {
  const [progress, setProgress] = useState(0); // 0..1
  const [currentIndex, setCurrentIndex] = useState(0);

  const ids = useMemo(() => sectionIds, [sectionIds]);

  useEffect(() => {
    let raf = 0;

    const calc = () => {
      const els = ids
        .map((id) => document.getElementById(id))
        .filter(Boolean) as HTMLElement[];

      if (els.length < 2) {
        setProgress(0);
        setCurrentIndex(0);
        return;
      }

      // Use viewport anchor a bit below top for stable "current section"
      const anchorY = window.scrollY + window.innerHeight * 0.35;

      const tops = els.map((el) => el.offsetTop);
      const last = tops.length - 1;

      let idx = 0;
      for (let i = 0; i < tops.length; i++) {
        if (anchorY >= tops[i]) idx = i;
      }
      if (idx > last) idx = last;

      // progress inside current section toward next section
      let pInside = 0;
      if (idx < last) {
        const start = tops[idx];
        const end = tops[idx + 1];
        const span = Math.max(1, end - start);
        pInside = (anchorY - start) / span;
        pInside = Math.min(1, Math.max(0, pInside));
      } else {
        // last section: progress depends on how far into it until bottom
        const start = tops[last];
        const docBottom =
          document.documentElement.scrollHeight - window.innerHeight;
        const span = Math.max(1, docBottom - start);
        pInside = (window.scrollY - start) / span;
        pInside = Math.min(1, Math.max(0, pInside));
      }

      const denom = Math.max(1, els.length - 1);
      const overall = Math.min(1, Math.max(0, (idx + pInside) / denom));

      setCurrentIndex(idx);
      setProgress(overall);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };

    calc();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return { progress, currentIndex };
}

// --- Animated Select (smooth open/close) ---

type Option = { label: string; value: string };

function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full bg-neutral-800 border border-white/5 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none transition-all font-bold text-gray-300 flex items-center justify-between"
      >
        <span className={`${selected ? "text-gray-200" : "text-gray-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500"
        >
          <FiChevronDown />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-3 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B0B] shadow-2xl"
          >
            <div className="max-h-56 overflow-auto">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-bold text-sm transition-colors ${
                    opt.value === value
                      ? "bg-emerald-500 text-black"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sections ---

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Results", href: "#results" },
    { name: "Programs", href: "#programs" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact", href: "#contact" },
  ];

  const onNavClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    smoothScrollToHash(href);
    history.replaceState(null, "", href);
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-black/95 backdrop-blur-lg py-4 border-b border-white/5"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a
          href="#home"
          onClick={onNavClick("#home")}
          className="text-2xl font-black tracking-tighter flex items-center space-x-2"
        >
          <span className="bg-emerald-500 text-black px-2 py-0.5 rounded">
            IRON
          </span>
          <span>COACH</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={onNavClick(link.href)}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              {link.name}
            </a>
          ))}
          <PrimaryButton
            className="px-6 py-2.5 text-xs uppercase tracking-widest"
            onClick={() => smoothScrollToHash("#contact")}
          >
            Start Now
          </PrimaryButton>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-2xl z-[70] text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-[#0A0A0A] z-[60] flex flex-col items-center justify-center space-y-10 lg:hidden px-6"
          >
            <div className="flex flex-col items-center space-y-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={onNavClick(link.href)}
                  className="text-3xl font-black hover:text-emerald-500 transition-colors tracking-tighter"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <PrimaryButton
              className="w-full max-w-xs"
              onClick={() => smoothScrollToHash("#contact")}
            >
              Get Started
            </PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden"
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero.png"
          alt="Athlete Training"
          className="w-full h-full object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left"
        >
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Live Coaching 2025
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tighter">
            MASTER <br />
            <span className="text-gradient italic">THE IRON.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-lg leading-relaxed font-medium">
            Scientifically optimized training and nutrition for high-performing
            men. Reach your peak state without wasting time.
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <PrimaryButton
              className="flex items-center justify-center space-x-2 px-10"
              onClick={() => smoothScrollToHash("#programs")}
            >
              <span>Start Growth</span>
              <FiArrowRight />
            </PrimaryButton>
            <button
              onClick={() => smoothScrollToHash("#results")}
              className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full font-black text-sm uppercase tracking-widest transition-all"
            >
              Case Studies
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative lg:block"
        >
          <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] max-h-[500px]">
            <img
              src="/images/test.jpg"
              alt="Elite Male Fitness"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />
        </motion.div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-24 bg-neutral-900/40 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[1/1] rounded-3xl overflow-hidden border border-white/5 relative group max-w-lg mx-auto lg:mx-0">
              <img
                src="/images/coach.jpg"
                alt="Head Coach Marcus"
                className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-0 left-0 right-0 p-10">
                <p className="text-emerald-400 font-black text-3xl tracking-tighter">
                  COACH MARCUS
                </p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">
                  Founder & CEO
                </p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-10">
            <SectionTitle
              subtitle="Philosophy"
              title="Built On Discipline"
              centered={false}
            />
            <p className="text-gray-400 text-lg leading-relaxed font-medium">
              After a decade of elite training, I've refined a system that
              eliminates the guesswork. We don't just build bodies; we build
              leaders through biological optimization and mental toughness.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                {
                  icon: <FiAward />,
                  title: "Pro Standards",
                  desc: "Top-tier certification in high performance.",
                },
                {
                  icon: <FiTrendingUp />,
                  title: "Data Driven",
                  desc: "Every rep and macro is tracked for growth.",
                },
                {
                  icon: <FiTarget />,
                  title: "Precision",
                  desc: "Tailored to your unique physiology.",
                },
                {
                  icon: <FiPhoneCall />,
                  title: "Commitment",
                  desc: "24/7 dedicated support for elite members.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 bg-neutral-800/50 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all"
                >
                  <div className="text-emerald-500 text-3xl mb-6">
                    {item.icon}
                  </div>
                  <h4 className="font-black text-xl mb-2 tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Transformations = () => {
  const cases = [
    {
      name: "Julian M.",
      after: `${import.meta.env.BASE_URL}images/1-proof.jpg`,
      result: "12% Body Fat Lost",
    },
    {
      name: "Mark K.",
      after: `${import.meta.env.BASE_URL}images/2-proof.jpg`,
      result: "8kg Muscle Gained",
    },
    {
      name: "Steve G.",
      after: `${import.meta.env.BASE_URL}images/3-proof.jpg`,
      result: "6 Months Recomp",
    },
  ];

  return (
    <section id="results" className="py-24">
      <div className="container mx-auto px-6">
        <SectionTitle subtitle="Case Studies" title="The Proof" />

        <div className="grid md:grid-cols-3 gap-10">
          {cases.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="group relative bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden hover:shadow-[0_20px_60px_-20px_rgba(16,185,129,0.3)] transition-all duration-700"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={item.after}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-10">
                <h4 className="text-2xl font-black mb-1">{item.name}</h4>
                <p className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em]">
                  {item.result}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Programs = () => {
  const [billing, setBilling] = useState("monthly");

  const plans = [
    {
      name: "Foundation",
      price: billing === "monthly" ? "149" : "399",
      period: billing === "monthly" ? "mo" : "3mo",
      desc: "For those starting their elite journey.",
      features: ["Custom Training App", "Macro Tracking", "Weekly Check-ins"],
      highlight: false,
    },
    {
      name: "Physique Pro",
      price: billing === "monthly" ? "299" : "799",
      period: billing === "monthly" ? "mo" : "3mo",
      desc: "Comprehensive transformation strategy.",
      features: [
        "Full Meal Planning",
        "Daily Form Feedback",
        "Direct Coach Support",
        "Priority Updates",
      ],
      highlight: true,
    },
    {
      name: "Executive",
      price: billing === "monthly" ? "599" : "1499",
      period: billing === "monthly" ? "mo" : "3mo",
      desc: "Concierge 1-on-1 performance coaching.",
      features: [
        "Bloodwork Analysis",
        "Weekly Zoom Strategy",
        "Travel Support Protocols",
        "Custom Bio-optimization",
      ],
      highlight: false,
    },
  ];

  return (
    <section id="programs" className="py-24 bg-neutral-900/40">
      <div className="container mx-auto px-6">
        <SectionTitle subtitle="Enrollment" title="Choose Your Path" />

        <div className="flex justify-center mb-20">
          <div className="bg-neutral-800 p-1 rounded-full border border-white/5 flex items-center relative">
            <motion.div
              layout
              transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
              style={{
                position: "absolute",
                top: 4,
                bottom: 4,
                left: billing === "monthly" ? 4 : "50%",
                width: "49%",
                zIndex: 0,
              }}
              className="bg-emerald-500 rounded-full shadow-lg"
            />
            <button
              onClick={() => setBilling("monthly")}
              className={`relative z-10 px-8 py-3 rounded-full text-[10px] font-black tracking-widest transition-colors duration-300 ${
                billing === "monthly" ? "text-black" : "text-gray-500"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBilling("quarterly")}
              className={`relative z-10 px-8 py-3 rounded-full text-[10px] font-black tracking-widest transition-colors duration-300 ${
                billing === "quarterly" ? "text-black" : "text-gray-500"
              }`}
            >
              QUARTERLY
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-12 rounded-[2.5rem] border transition-all duration-500 flex flex-col ${
                plan.highlight
                  ? "bg-neutral-800 border-emerald-500 scale-105 z-10 shadow-2xl shadow-emerald-500/10"
                  : "bg-neutral-900 border-white/5 hover:border-white/10"
              }`}
            >
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">
                {plan.name}
              </h3>
              <p className="text-gray-500 text-sm mb-10 font-medium leading-relaxed">
                {plan.desc}
              </p>

              <div className="flex items-baseline mb-10">
                <span className="text-5xl font-black tracking-tighter">
                  ${plan.price}
                </span>
                <span className="text-gray-600 text-[10px] ml-2 font-black tracking-[0.2em] uppercase">
                  /{plan.period}
                </span>
              </div>

              <div className="space-y-4 mb-12 flex-grow">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-400 text-sm font-semibold">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  plan.highlight
                    ? "bg-emerald-50 text-black hover:bg-white"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
              >
                Join Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const reviews = [
    {
      name: "Damian V.",
      role: "CEO",
      text: "Marcus changed my perspective on efficiency. I'm stronger at 40 than I was at 20.",
      img: "/images/1-proof.jpg",
    },
    {
      name: "Brian L.",
      role: "Manager",
      text: "The app and the feedback loops are flawless. Results are inevitable with this system.",
      img: "/images/2-proof.jpg",
    },
    {
      name: "Ricardo S.",
      role: "Founder",
      text: "Best coaching experience of my life. Zero fluff, just high-performance results.",
      img: "/images/3-proof.jpg",
    },
  ];

  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto px-6">
        <SectionTitle subtitle="Testimonials" title="Elite Feedback" />

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-10 bg-neutral-900 border border-white/5 rounded-[2.5rem]"
            >
              <div className="flex items-center space-x-1 text-emerald-500 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FiStar key={i} fill="currentColor" size={14} />
                ))}
              </div>
              <p className="text-gray-400 italic mb-10 leading-relaxed font-medium">
                "{rev.text}"
              </p>
              <div className="flex items-center space-x-5">
                <img
                  src={rev.img}
                  className="w-12 h-12 rounded-full object-cover grayscale"
                  alt={rev.name}
                />
                <div>
                  <p className="font-black text-lg tracking-tight">
                    {rev.name}
                  </p>
                  <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">
                    {rev.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [goal, setGoal] = useState("");

  return (
    <section
      id="contact"
      className="py-24 bg-neutral-900/40 border-t border-white/5"
    >
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <SectionTitle
              subtitle="Strategy"
              title="Join The Elite"
              centered={false}
            />
            <p className="text-gray-400 mb-12 max-w-md text-lg leading-relaxed font-medium">
              Ready to leave mediocrity behind? Apply for a strategy session to
              see if you're a fit for the 2025 roster.
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex items-center space-x-5 p-8 bg-neutral-800 rounded-3xl border border-white/5 group hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-xl">
                  <FiPhoneCall size={28} />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1">
                    Direct Strategy
                  </p>
                  <p className="font-black text-xl tracking-tight">
                    Schedule Your Call
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-5">
              {[FiInstagram, FiTwitter, FiYoutube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-12 h-12 bg-white/5 hover:bg-emerald-500 hover:text-black transition-all rounded-full flex items-center justify-center border border-white/10"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-neutral-900 p-10 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl"
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Your Identity
                </label>
                <div className="relative">
                  <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    className="w-full bg-neutral-800 border border-white/5 focus:border-emerald-500 rounded-2xl pl-14 pr-6 py-4 outline-none transition-all font-bold placeholder:text-gray-600"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Email Connection
                </label>
                <div className="relative">
                  <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    className="w-full bg-neutral-800 border border-white/5 focus:border-emerald-500 rounded-2xl pl-14 pr-6 py-4 outline-none transition-all font-bold placeholder:text-gray-600"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Primary Objective
                </label>

                {/* Smooth animated select */}
                <AnimatedSelect
                  value={goal}
                  onChange={setGoal}
                  placeholder="Select Goal"
                  options={[
                    { label: "Fat Loss & Shred", value: "fatloss" },
                    { label: "Maximum Hypertrophy", value: "hypertrophy" },
                    { label: "Elite Performance", value: "performance" },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Intelligence
                </label>
                <textarea
                  className="w-full bg-neutral-800 border border-white/5 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none transition-all font-bold h-32 resize-none placeholder:text-gray-600"
                  placeholder="Tell us about your current status..."
                ></textarea>
              </div>

              <PrimaryButton className="w-full py-5 text-sm uppercase tracking-[0.2em]">
                Apply To Join
              </PrimaryButton>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const onNavClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    smoothScrollToHash(href);
    history.replaceState(null, "", href);
  };

  return (
    <footer className="py-16 bg-black border-t border-white/5">
      <div className="container mx-auto px-6 text-center">
        <a
          href="#home"
          onClick={onNavClick("#home")}
          className="text-3xl font-black tracking-tighter flex items-center justify-center space-x-2 mb-8"
        >
          <span className="bg-emerald-500 text-black px-2 py-0.5 rounded">
            IRON
          </span>
          <span>COACH</span>
        </a>

        <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-8">
          <nav className="lg:flex items-center space-x-8">
            <a
              href="#home"
              onClick={onNavClick("#home")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={onNavClick("#about")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              About
            </a>
            <a
              href="#results"
              onClick={onNavClick("#results")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              Results
            </a>
            <a
              href="#programs"
              onClick={onNavClick("#programs")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              Programs
            </a>
            <a
              href="#testimonials"
              onClick={onNavClick("#testimonials")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#contact"
              onClick={onNavClick("#contact")}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-emerald-400 transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">
          © 2025 Iron Coach Performance Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

// --- Scroll Progress Button (appears after section 2) ---

function ScrollProgressToTop({
  progress,
  show,
}: {
  progress: number;
  show: boolean;
}) {
  const pct = Math.round(progress * 100);

  // ring fill via conic-gradient
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(rgba(16,185,129,1) ${pct}%, rgba(255,255,255,0.12) 0%)`,
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 14, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-10 right-10 w-16 h-16 rounded-full z-40"
          aria-label="Back to top"
        >
          <div
            style={ringStyle}
            className="w-full h-full rounded-full p-[3px] shadow-2xl"
          >
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                <FiArrowRight className="-rotate-90 text-2xl" />
              </div>
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

const App = () => {
  // IMPORTANT: order matters for progress.
  // progress starts from hero=0 → contact=1
  const SECTION_IDS = [
    "home",
    "about",
    "results",
    "programs",
    "testimonials",
    "contact",
  ];
  const { progress, currentIndex } = useScrollProgressBySections(SECTION_IDS);

  // show button only after reaching section 2 (index 1 => about)
  const showScrollBtn = currentIndex >= 1;

  return (
    <LayoutGroup>
      <div className="relative bg-[#0A0A0A] overflow-hidden selection:bg-emerald-500 selection:text-black scroll-smooth">
        <Header />
        <main>
          <Hero />
          <About />
          <Transformations />
          <Programs />
          <Testimonials />
          <Contact />
        </main>
        <Footer />

        <ScrollProgressToTop progress={progress} show={showScrollBtn} />
      </div>
    </LayoutGroup>
  );
};

export default App;
