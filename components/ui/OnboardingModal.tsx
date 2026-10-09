"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "./Avatar";

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  // Check if user has completed onboarding before
  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    if (completed === "true") {
      onComplete();
      return;
    }

    // Show onboarding
    const timer = setTimeout(() => {
      // Start animation
    }, 100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem("onboarding_completed", "true");
      onComplete();
    }, 260);
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  };

  const steps = [
    {
      title: "Welcome to Stack Underflow",
      subtitle: "Your hub for student collaboration and portfolio building",
      icon: "gift",
      color: "bg-accent",
    },
    {
      title: "Discover Projects",
      subtitle: "Browse coursework, portfolios, and real-world products looking for team members",
      icon: "magnify",
      color: "bg-surface",
    },
    {
      title: "Find Your Role",
      subtitle: "Look for projects that need your skills — or start your own",
      icon: "code-braces",
      color: "bg-surface",
    },
    {
      title: "Connect & Build",
      subtitle: "Apply to projects, collaborate with peers, and ship impressive work together",
      icon: "account-group",
      color: "bg-surface",
    },
  ];

  const currentStep = steps[step];

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[200] flex items-center justify-center bg-black/50 transition-opacity duration-200",
        closing ? "opacity-0" : "opacity-100"
      )}
      onClick={handleClose}
    >
      <div
        className="max-w-lg rounded-xl bg-bg p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 w-8 rounded-full transition-all duration-300",
                i === step ? "w-12 bg-accent" : "bg-placeholder"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={clsx(
              "mb-6 flex size-20 items-center justify-center rounded-full text-ink",
              currentStep.color
            )}
          >
            <Icon name={currentStep.icon} size={40} />
          </div>

          {/* Text */}
          <h2 className="mb-3 text-2xl font-medium">{currentStep.title}</h2>
          <p className="text-base text-muted">{currentStep.subtitle}</p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-between gap-4">
          {/* Skip button */}
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-medium text-muted underline decoration-1 transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Skip for now
          </button>

          {/* Next/Finish button */}
          <button
            type="button"
            onClick={() => {
              if (step < steps.length - 1) {
                setStep((s) => s + 1);
              } else {
                handleClose();
              }
            }}
            className="pressable flex cursor-pointer items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {step < steps.length - 1 ? "Next" : "Get Started"}
            {step < steps.length - 1 && <Icon name="chevron-right" size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
