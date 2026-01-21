import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { DiceThree } from '@phosphor-icons/react/dist/ssr';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: (phone: string, name?: string) => void;
}

function generateRandomPhone(): string {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `97${randomDigits}`;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Phone number must be 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    if (value.length === 10) {
      validatePhone(value);
    } else if (value.length > 0) {
      setPhoneError('Phone number must be 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleGeneratePhone = () => {
    const randomPhone = generateRandomPhone();
    setPhone(randomPhone);
    setPhoneError('');
  };

  const handleStartCall = () => {
    if (!validatePhone(phone)) {
      return;
    }
    onStartCall(phone, name.trim() || undefined);
  };

  const canStart = phone.length === 10 && !phoneError;

  return (
    <div
      ref={ref}
      inert={disabled}
      className="fixed inset-0 z-10 mx-auto flex h-svh flex-col items-center justify-center bg-black text-center"
    >
      <Image
        src="/ai.png"
        width={380}
        height={100}
        alt="Logo"
        className="mb-6"
        priority
      />

      <p className="text-fg1 mb-8 max-w-prose pt-1 font-medium leading-6">
        Chat live with an AI Assistant
      </p>

      {/* Name and Phone inputs */}
      <div className="flex w-full max-w-xl gap-4 px-4">
        {/* Name Input (Optional) */}
        <div className="flex-1 space-y-2">
          <label className="text-fg1 block text-left text-sm font-medium">
            Your Name <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prasad"
            className="text-fg1 placeholder:text-muted-foreground w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Phone Number Input */}
        <div className="flex-1 space-y-2">
          <label className="text-fg1 block text-left text-sm font-medium">
            Your Phone Number <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="6290167736"
              className={cn(
                'text-fg1 placeholder:text-muted-foreground flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary',
                phoneError ? 'border-destructive' : 'border-border'
              )}
              maxLength={10}
            />
            <button
              type="button"
              onClick={handleGeneratePhone}
              className="bg-muted hover:bg-muted/80 group relative cursor-pointer rounded-md p-2 transition-colors"
              title="Random phone number [for testing :P]"
            >
              <DiceThree size={24} weight="bold" />
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                Random phone number [for testing :P]
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error message below inputs */}
      {phoneError && (
        <p className="text-destructive mt-2 w-full max-w-2xl px-4 text-left text-xs">{phoneError}</p>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={handleStartCall}
        disabled={!canStart}
        className="mt-6 w-64 font-mono"
      >
        {startButtonText}
      </Button>

      {/* Floating admin button */}
      <Link
        href="/admin"
        aria-label="Open admin dashboard"
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card/90 shadow-lg backdrop-blur transition hover:scale-105"
      >
        <Image src="/admin_icon.png" alt="Admin" width={28} height={28} />
      </Link>
    </div>
  );
};
