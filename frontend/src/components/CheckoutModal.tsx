import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Tag, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import brain from 'utils/brain';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onCheckoutStart: () => void;
  onCheckoutComplete: () => void;
  includeProWaitlist?: boolean;
  // New optional URLs to customize redirect behavior per page
  successUrl?: string;
  cancelUrl?: string;
}

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  userEmail, 
  onCheckoutStart, 
  onCheckoutComplete, 
  includeProWaitlist,
  successUrl,
  cancelUrl,
}: CheckoutModalProps) {
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountValidation, setDiscountValidation] = useState<{
    valid: boolean;
    message: string;
    discount_amount?: number;
    discount_type?: string;
  } | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const basePrice = 7.99;
  const discountAmount = discountValidation?.valid && discountValidation.discount_amount ? discountValidation.discount_amount : 0;
  const finalPrice = discountValidation?.valid ? basePrice - discountAmount : basePrice;

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountValidation(null);
      return;
    }

    setIsValidatingDiscount(true);
    try {
      console.log('🔍 Validating discount code:', { code: discountCode.trim().toUpperCase(), userEmail, basePrice });
      
      const response = await brain.apply_discount({
        code: discountCode.trim().toUpperCase(),
        user_email: userEmail,
        order_amount: basePrice
      });

      console.log('🔍 Discount validation response:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Discount validation data:', data);
        setDiscountValidation(data);
        
        if (data.valid) {
          toast.success(`Discount applied! ${data.message}`);
        } else {
          toast.error(data.message);
        }
      } else {
        console.error('🔍 Discount validation failed with status:', response.status);
        setDiscountValidation({
          valid: false,
          message: 'Invalid discount code'
        });
        toast.error('Invalid discount code');
      }
    } catch (error) {
      console.error('🔍 Discount validation error:', error);
      setDiscountValidation({
        valid: false,
        message: 'Error validating discount code'
      });
      toast.error('Error validating discount code');
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleCheckout = async () => {
    setIsCreatingCheckout(true);
    onCheckoutStart();

    try {
      // Use correct domain based on environment
      const baseUrl = window.location.hostname.endsWith('riff.new')
        ? 'https://www.tradingbait.com' 
        : window.location.origin;
      
      // Respect overrides from props, fallback to defaults used elsewhere
      const success = successUrl ?? baseUrl + '/dashboard';
      const cancel = cancelUrl ?? baseUrl + '/';
      
      const response = await brain.create_stripe_checkout({
        customer_email: userEmail,
        success_url: success,
        cancel_url: cancel,
        referral_code: (discountValidation?.valid && discountCode.trim()) ? discountCode.trim() : null,
        include_pro_waitlist: includeProWaitlist || false
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🛒 Checkout created with discount:', discountCode || 'none');
        
        // Close modal and redirect to Stripe
        onClose();
        window.location.href = data.checkout_url;
        onCheckoutComplete();
      } else {
        toast.error('Failed to create checkout session');
        onCheckoutComplete();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
      onCheckoutComplete();
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleDiscountCodeChange = (value: string) => {
    setDiscountCode(value);
    // Reset validation when user changes the code
    setDiscountValidation(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscribe to TradingBait Pro
          </DialogTitle>
          <DialogDescription>
            Join thousands of profitable traders using our AI-powered trading journal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">TradingBait Pro</CardTitle>
              <CardDescription>
                Advanced trading analytics and AI insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Monthly Subscription</span>
                  <span className={discountValidation?.valid ? 'line-through text-muted-foreground' : 'font-semibold'}>
                    ${basePrice.toFixed(2)}
                  </span>
                </div>
                
                {discountValidation?.valid && (
                  <>
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        Discount Applied
                      </span>
                      <span className="font-semibold">
                        -${discountAmount.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">${finalPrice.toFixed(2)}/month</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited trade tracking
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    AI-powered insights and coaching
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced analytics and reports
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Trading platform integrations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Code Section */}
          <div className="space-y-3">
            <Label htmlFor="discount-code" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Discount Code (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="discount-code"
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => handleDiscountCodeChange(e.target.value.toUpperCase())}
                className="font-mono"
                maxLength={50}
              />
              <Button
                variant="outline"
                onClick={validateDiscountCode}
                disabled={!discountCode.trim() || isValidatingDiscount}
                className="shrink-0"
              >
                {isValidatingDiscount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
            
            {discountValidation && (
              <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                discountValidation.valid 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {discountValidation.valid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {discountValidation.message}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isCreatingCheckout}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={isCreatingCheckout}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {isCreatingCheckout ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to Stripe to complete your payment securely.
            Cancel anytime from your account settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
