'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { ApiErrorAlert, PageLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    setErrorMsg(null);
    try {
      await login({
        email: data.email,
        password: data.password,
      });

      // Redirect user to original page if specified, otherwise dashboard
      const redirectPath = searchParams.get('redirect') || '/admin/dashboard';
      router.push(redirectPath);
    } catch (err: unknown) {
      // Extract error message from API response
      const apiMsg = getApiErrorMessage(err);
      setErrorMsg(apiMsg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8 text-neutral-900">
      <div className="w-full max-w-md space-y-8 bg-white p-8 border border-neutral-200 rounded-2xl shadow-sm">
        {/* Branding header */}
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-widest uppercase text-neutral-400">
            Vasanthi Designers
          </h2>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            Admin Console
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Sign in to access your administrative operations dashboard
          </p>
        </div>

        {/* Global error alerts */}
        <ApiErrorAlert message={errorMsg} />

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Email input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-neutral-600 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email"
                type="email"
                disabled={isPending}
                autoComplete="email"
                {...register('email')}
                className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900
                  ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-neutral-200'}
                  disabled:opacity-50
                `}
                placeholder="name@vasanthidesigners.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-neutral-600 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                disabled={isPending}
                autoComplete="current-password"
                {...register('password')}
                className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-neutral-900
                  ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-neutral-200'}
                  disabled:opacity-50
                `}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white hover:bg-neutral-800 focus:outline-none transition disabled:opacity-50 flex items-center justify-center"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
