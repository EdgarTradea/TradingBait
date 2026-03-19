import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCurrentUser } from 'app';
import { CheckoutModal } from 'components/CheckoutModal';
import { SVGProps } from 'react';
import brain from 'utils/brain';
import { handleReferralOnPageLoad } from 'utils/referralTracking';

// Fade-in animation variant
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// Shared font styles
const serifFont = { fontFamily: "'Playfair Display', Georgia, serif" };

export default function App() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    handleReferralOnPageLoad();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGetStarted = async () => {
    if (!user) {
      navigate('/login?mode=signup&intent=trial');
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
    >
      {/* ─── NAV ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="text-white font-bold text-lg tracking-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            Trading<span className="text-amber-400">Bait</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <button
            onClick={handleLogin}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Log in
          </button>
          <button
            onClick={handleGetStarted}
            disabled={isCreatingCheckout}
            className="text-sm bg-white text-black font-semibold px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Get started
          </button>
        </nav>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-24 pb-32">
        {/* Subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(180,120,0,0.10) 0%, transparent 70%)',
          }}
        />

        <motion.div
          className="max-w-4xl mx-auto space-y-8"
          initial="hidden"
          animate="visible"
        >
          {/* Label */}
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-xs uppercase tracking-widest text-zinc-500 font-medium"
          >
            Trading Journal & AI Coach
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            custom={0.1}
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight"
            style={serifFont}
          >
            Trade like a{' '}
            <span
              className="text-amber-400 italic"
              style={serifFont}
            >
              professional.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Build the routines, discipline, and analytical edge that separates
            consistent traders from the rest. Powered by AI.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            custom={0.3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={handleGetStarted}
              disabled={isCreatingCheckout}
              className="bg-white text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-zinc-200 transition-colors shadow-lg"
            >
              {isCreatingCheckout ? 'Processing…' : 'Get started — $7.99/mo'}
            </button>
            <button
              onClick={handleLogin}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Already have an account
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <span className="text-xs text-zinc-600 uppercase tracking-widest">Scroll</span>
          <motion.div
            className="w-px h-8 bg-zinc-700"
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      {/* ─── SECTION 1: ROUTINES ─── */}
      <Section>
        <SectionLabel>Routines</SectionLabel>
        <SectionHeadline>
          Discipline is{' '}
          <GoldItalic>built, not born.</GoldItalic>
        </SectionHeadline>
        <SectionBody>
          Most traders fail not because they lack skill — but because they lack
          structure. TradingBait lets you build and track daily routines that
          keep you consistent, sharp, and mentally prepared for every session.
        </SectionBody>
        <FeatureGrid>
          <FeatureCard
            number="01"
            title="Pre-session checklists"
            description="Enter every session with intention. Confirm your rules, mindset, and key levels before the market opens."
          />
          <FeatureCard
            number="02"
            title="Habit streaks"
            description="Track which routines you complete each day. Consistent habits compound into consistent results."
          />
          <FeatureCard
            number="03"
            title="Mood & mindset logging"
            description="Know when you're in the right state to trade — and when to sit on your hands."
          />
        </FeatureGrid>
      </Section>

      {/* ─── DIVIDER ─── */}
      <Divider />

      {/* ─── SECTION 2: PROFESSIONAL TRADING ─── */}
      <Section>
        <SectionLabel>Professional Trading</SectionLabel>
        <SectionHeadline>
          Your edge is in{' '}
          <GoldItalic>the details.</GoldItalic>
        </SectionHeadline>
        <SectionBody>
          Professionals review every trade. TradingBait automatically captures
          your trades, giving you a frictionless journaling experience so you
          can focus on analysis — not data entry.
        </SectionBody>
        <FeatureGrid>
          <FeatureCard
            number="04"
            title="Automated trade import"
            description="Upload your trade history in seconds. No manual entry. Your journal starts the moment your data arrives."
          />
          <FeatureCard
            number="05"
            title="Prop firm tracking"
            description="Stay on top of drawdown limits, daily loss rules, and evaluation targets across all your challenges."
          />
          <FeatureCard
            number="06"
            title="AI trade review"
            description="Get a brutally honest breakdown of each trade — what you did right, what you ignored, and where to improve."
          />
        </FeatureGrid>
      </Section>

      {/* ─── DIVIDER ─── */}
      <Divider />

      {/* ─── SECTION 3: ANALYTICS ─── */}
      <Section>
        <SectionLabel>Analytics</SectionLabel>
        <SectionHeadline>
          See what others{' '}
          <GoldItalic>can't see.</GoldItalic>
        </SectionHeadline>
        <SectionBody>
          Raw data doesn't tell a story — patterns do. TradingBait surfaces the
          insights buried in your trade history: your best sessions, worst
          habits, and untapped opportunities.
        </SectionBody>
        <FeatureGrid>
          <FeatureCard
            number="07"
            title="Performance by session & instrument"
            description="Find out exactly when and what you trade best. Double down on your edge, cut what doesn't work."
          />
          <FeatureCard
            number="08"
            title="Risk & drawdown analysis"
            description="Understand your true risk profile. Spot overexposure before it becomes a blown account."
          />
          <FeatureCard
            number="09"
            title="AI-powered improvement areas"
            description="The AI identifies your top 3 areas of improvement each week — specific, actionable, and data-backed."
          />
        </FeatureGrid>
      </Section>

      {/* ─── PRICING ─── */}
      <Section>
        <SectionLabel>Pricing</SectionLabel>
        <SectionHeadline>
          Simple, transparent{' '}
          <GoldItalic>pricing.</GoldItalic>
        </SectionHeadline>
        <SectionBody>
          Everything you need to trade like a professional — journals, routines, analytics, and AI coaching.
        </SectionBody>
        <motion.div variants={fadeUp} custom={0.2}>
          <div className="border border-zinc-800 rounded-2xl p-10 max-w-sm flex flex-col gap-6 bg-zinc-950 hover:border-zinc-700 transition-colors">
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold text-white" style={serifFont}>$7.99</span>
              <span className="text-zinc-500 text-sm mb-3">/ month</span>
            </div>
            <ul className="space-y-3 text-sm text-zinc-400">
              {[
                'Automated trade import',
                'AI trade review & coaching',
                'Daily routines & habit tracking',
                'Advanced analytics & dashboards',
                'Prop firm challenge tracking',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-amber-400 text-base">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleGetStarted}
              disabled={isCreatingCheckout}
              className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-full hover:bg-zinc-200 transition-colors mt-2"
            >
              {isCreatingCheckout ? 'Processing…' : 'Get started'}
            </button>
            <p className="text-center text-xs text-zinc-600">Cancel anytime. No hidden fees.</p>
          </div>
        </motion.div>
      </Section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-40 px-6 text-center">
        <motion.div
          className="max-w-3xl mx-auto space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight"
            style={serifFont}
          >
            Ready to trade like you{' '}
            <GoldItalic>mean it?</GoldItalic>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={0.1}
            className="text-zinc-400 text-lg max-w-xl mx-auto"
          >
            $7.99 / month. Cancel anytime.
          </motion.p>
          <motion.div variants={fadeUp} custom={0.2}>
            <button
              onClick={handleGetStarted}
              disabled={isCreatingCheckout}
              className="bg-amber-400 text-black font-semibold text-sm px-10 py-4 rounded-full hover:bg-amber-300 transition-colors shadow-xl"
            >
              {isCreatingCheckout ? 'Processing…' : 'Get started'}
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-900 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-zinc-600">
          © {new Date().getFullYear()} TradingBait. All rights reserved.
        </span>
        <div className="flex items-center gap-6 text-sm text-zinc-600">
          <button onClick={handleLogin} className="hover:text-white transition-colors">
            Log in
          </button>
          <button onClick={handleGetStarted} className="hover:text-white transition-colors">
            Get started
          </button>
        </div>
      </footer>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        userEmail={user?.email || ''}
        onCheckoutStart={() => setIsCreatingCheckout(true)}
        onCheckoutComplete={() => {
          setIsCreatingCheckout(false);
          setIsCheckoutModalOpen(false);
        }}
      />
    </div>
  );
}

// ─── LAYOUT PRIMITIVES ───────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      className="py-28 px-6 max-w-5xl mx-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="space-y-10">{children}</div>
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      variants={fadeUp}
      custom={0}
      className="text-xs uppercase tracking-widest text-amber-400 font-medium"
    >
      {children}
    </motion.p>
  );
}

function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      variants={fadeUp}
      custom={0.05}
      className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight max-w-3xl"
      style={serifFont}
    >
      {children}
    </motion.h2>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      variants={fadeUp}
      custom={0.1}
      className="text-zinc-400 text-lg leading-relaxed max-w-2xl"
    >
      {children}
    </motion.p>
  );
}

function GoldItalic({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-amber-400 italic"
      style={serifFont}
    >
      {children}
    </span>
  );
}

function FeatureGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={0.15}
      className="grid sm:grid-cols-3 gap-px border border-zinc-800 rounded-2xl overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-zinc-950 p-8 flex flex-col gap-5 hover:bg-zinc-900 transition-colors">
      <span className="text-xs text-zinc-600 font-mono">{number}</span>
      <h3 className="text-white font-semibold text-base leading-snug">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Divider() {
  return <div className="max-w-5xl mx-auto px-6"><div className="border-t border-zinc-900" /></div>;
}
