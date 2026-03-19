import { useState } from "react";
import { useUserGuardContext } from "app";
import brain from "brain";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ContextualHelp } from "components/ContextualHelp";
import { toast } from "sonner";

export function ContactSupportForm() {
  const { user } = useUserGuardContext();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (message.trim().length > 5000) {
      newErrors.message = 'Message must be less than 5000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      return;
    }

    if (!user.email) {
      toast.error("Your email is not available. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedData = {
        user_email: user.email,
        subject: sanitizeInput(subject),
        message: sanitizeInput(message),
      };
      
      const response = await brain.send_support_email(sanitizedData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success("Your message has been sent successfully!");
      setSubject("");
      setMessage("");
      setErrors({});
    } catch (error: any) {
      console.error("Failed to send support email:", error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error.message?.includes('HTTP 400')) {
        errorMessage = 'Invalid form data. Please check your inputs and try again.';
      } else if (error.message?.includes('HTTP 429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMessage = (value: string) => {
    // Limit character count in real-time
    const truncated = value.substring(0, 5000);
    setMessage(truncated);
    
    // Clear error when user starts typing
    if (errors.message) {
      setErrors(prev => ({ ...prev, message: '' }));
    }
  };

  const updateSubject = (value: string) => {
    setSubject(value);
    
    // Clear error when user selects
    if (errors.subject) {
      setErrors(prev => ({ ...prev, subject: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              Need help? Check our help articles first or send us a message.
            </CardDescription>
          </div>
          <ContextualHelp 
            topic="troubleshooting"
            title="Browse Help Articles"
            variant="button"
            size="sm"
          />
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Your Email</Label>
            <Input 
              id="email" 
              type="email"
              value={user.email ?? ""} 
              readOnly 
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={updateSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing-issue">Billing Issue</SelectItem>
                <SelectItem value="technical-problem">Technical Problem</SelectItem>
                <SelectItem value="feature-request">Feature Request</SelectItem>
                <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                <SelectItem value="account-help">Account Help</SelectItem>
                <SelectItem value="data-import">Data Import Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message ({message.length}/5000)</Label>
            <Textarea
              id="message"
              placeholder="Please describe your issue or question in detail..."
              value={message}
              onChange={(e) => updateMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !subject || !message}
            className="w-full"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
