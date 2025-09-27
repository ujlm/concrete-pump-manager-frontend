"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Building2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Auto-focus email field on mount
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (emailInput) {
      emailInput.focus();
    }

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        // Map Supabase errors to user-friendly messages
        let errorMessage = 'An error occurred during sign in';

        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'Email not confirmed':
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
            break;
          case 'Too many requests':
            errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
            break;
          case 'User not found':
            errorMessage = 'No account found with this email address.';
            break;
          default:
            errorMessage = error.message;
        }

        setErrors({ general: errorMessage });
        return;
      }

      // Handle remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Redirect to dashboard on success
      router.push('/protected');

    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const form = e.currentTarget.closest('form') as HTMLFormElement;
      form?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Company Branding */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Concrete Pump Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Professional concrete pumping management system
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "transition-all duration-200",
                    errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "pr-12 transition-all duration-200",
                      errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-destructive" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, rememberMe: checked === true }))
                  }
                  disabled={isLoading}
                  aria-describedby="remember-me-description"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Remember my email
                </Label>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive" role="alert">
                    {errors.general}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium transition-all duration-200"
                disabled={isLoading}
                aria-describedby={isLoading ? "loading-description" : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                    <span id="loading-description" className="sr-only">
                      Please wait while we sign you in
                    </span>
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Navigation Links */}
            <div className="space-y-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-medium text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Create account
                </Link>
              </p>

              <Link
                href="/"
                className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={isLoading ? -1 : 0}
              >
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Concrete Pump Manager. Professional pumping solutions.
          </p>
        </div>
      </div>
    </div>
  );
}
