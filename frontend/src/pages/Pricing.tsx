import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'utils/brain';
import { useCurrentUser } from 'app';

const FEATURES = [
  { name: 'Automated trade import', desc: 'Upload CSV files from any platform' },
  { name: 'AI trade review & coaching', desc: 'Personalised insights after every session' },
  { name: 'Daily routines & habit tracking', desc: 'Build a consistent trading process' },
  { name: 'Advanced analytics & dashboards', desc: 'Equity curves, heatmaps, risk metrics' },
  { name: 'Prop firm challenge tracking', desc: 'Monitor drawdown rules & targets' },
  { name: 'Trading journal', desc: 'Mood, notes, and reflection per session' },
];

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = window.location.hostname.endsWith('riff.new')
        ? 'https://www.tradingbait.com'
        : window.location.origin;

      const response = await brain.create_trial_checkout2({
        customer_email: user.email || '',
        success_url: `${baseUrl}/dashboard`,
        cancel_url: `${baseUrl}/pricing`,
        discount_code: discountCode.trim() || undefined,
        plan_name: 'basic',
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.message || 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-24">
      {/* Header */}
      <div className="text-center mb-16 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">Simple pricing.</h1>
        <p className="text-zinc-400 text-lg">
          Everything you need to trade professionally — for less than a coffee a week.
        </p>
      </div>

      {/* Pricing card */}
      <div className="w-full max-w-md border border-zinc-800 rounded-2xl p-10 bg-zinc-950 flex flex-col gap-8">
        {/* Price */}
        <div className="flex items-end gap-2">
          <span className="text-7xl font-bold text-white">$7.99</span>
          <span className="text-zinc-500 text-sm mb-3">/ month</span>
        </div>

        {/* Features */}
        <ul className="space-y-4">
          {FEATURES.map((f) => (
            <li key={f.name} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-sm font-medium">{f.name}</div>
                <div className="text-zinc-500 text-xs">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        {/* Discount code */}
        <div className="space-y-3">
          <button
            onClick={() => setShowDiscount(!showDiscount)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <Tag className="h-3 w-3" />
            {showDiscount ? 'Hide' : 'Have a discount code?'}
          </button>
          {showDiscount && (
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono"
                maxLength={50}
              />
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-white text-black font-semibold text-sm py-4 rounded-full hover:bg-zinc-200 transition-colors"
        >
          {isLoading ? 'Redirecting to Stripe…' : 'Get started — $7.99/mo'}
        </button>

        <p className="text-center text-xs text-zinc-600">Cancel anytime. No hidden fees. Powered by Stripe.</p>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-lg w-full grid gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6">
            <h4 className="font-semibold text-white mb-2">What's included?</h4>
            <p className="text-zinc-400 text-sm">All 6 features listed above. No tiers, no upsells.</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6">
            <h4 className="font-semibold text-white mb-2">How does billing work?</h4>
            <p className="text-zinc-400 text-sm">You're charged $7.99 immediately and then monthly. Cancel anytime from Settings.</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-6">
            <h4 className="font-semibold text-white mb-2">Is my card secure?</h4>
            <p className="text-zinc-400 text-sm">All payments are processed by Stripe. We never store your card details.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pricing;
