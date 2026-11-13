import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRICING_PLANS, BKASH_CONFIG } from '../data/pricingPlans';
import { submitPaymentUpgradeRequest } from '../services/firebaseDb';
import { toBengaliNumber } from '../utils/bengaliUtils';
import { ModalShell } from './ui/ModalShell';
import {
  CheckCircle2,
  Crown,
  Upload,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import { compressScreenshot } from '../utils/imageCompressor';

export const PricingUpgradeModal: React.FC = () => {
  const {
    isPricingModalOpen,
    setIsPricingModalOpen,
    currentUser,
    userProfile,
    currentPlan,
    selectedUpgradePlan,
    setSelectedUpgradePlan,
    showToast,
    setIsAuthModalOpen,
  } = useApp();

  const [step, setStep] = useState<'plans' | 'payment'>('plans');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isCompressingScreenshot, setIsCompressingScreenshot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const currentPlanConfig =
    PRICING_PLANS.find((p) => p.id === selectedUpgradePlan) || PRICING_PLANS[1];

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(BKASH_CONFIG.number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
    showToast('বিকাশ নম্বর কপি করা হয়েছে: ' + BKASH_CONFIG.number);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingScreenshot(true);
    try {
      const optimized = await compressScreenshot(file, 900, 0.7);
      setScreenshotDataUrl(optimized);
      showToast('পেমেন্ট স্ক্রিনশট অপটিমাইজ করে যুক্ত করা হয়েছে');
    } catch (err) {
      console.warn('Screenshot compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotDataUrl(reader.result as string);
        showToast('পেমেন্ট স্ক্রিনশট যুক্ত হয়েছে');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingScreenshot(false);
    }
  };

  const handleStartUpgrade = (planId: 'pro' | 'enterprise') => {
    if (!currentUser) {
      setIsPricingModalOpen(false);
      setIsAuthModalOpen(true);
      showToast('প্যাকেজ আপগ্রেড করতে অনুগ্রহ করে প্রথমে সাইন-ইন করুন');
      return;
    }
    setSelectedUpgradePlan(planId);
    setStep('payment');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!senderPhone.trim()) {
      showToast('যে বিকাশ নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন');
      return;
    }

    if (!transactionId.trim()) {
      showToast('বিকাশ ট্রানজেকশন আইডি (TrxID) লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPaymentUpgradeRequest({
        userId: currentUser.uid,
        userEmail: currentUser.email || 'user@example.com',
        userName: currentUser.displayName || userProfile?.displayName || 'ব্যবহারকারী',
        targetPlan: selectedUpgradePlan,
        amount: currentPlanConfig.price,
        senderPhone: senderPhone.trim(),
        transactionId: transactionId.trim().toUpperCase(),
        screenshotUrl: screenshotDataUrl || undefined,
      });

      setSubmissionSuccess(true);
      showToast('পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! সুপার এডমিন শীঘ্রই এক্টিভেট করবেন।');
    } catch (err) {
      console.error('Failed to submit payment upgrade:', err);
      showToast('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsPricingModalOpen(false);
    setStep('plans');
    setSubmissionSuccess(false);
    setSenderPhone('');
    setTransactionId('');
    setScreenshotDataUrl(null);
  };

  return (
    <ModalShell
      isOpen={isPricingModalOpen}
      onClose={handleClose}
      title="প্রাইসিং ও মেম্বারশিপ প্যাকেজ"
      subtitle="বিকাশ সেন্ড মানি পেমেন্ট · ১ মাসের পূর্ণ অ্যাক্সেস"
      icon={<Crown className="w-5 h-5" />}
      maxWidthClass="max-w-4xl"
    >
      <div className="p-5 sm:p-6 space-y-6">
        {step === 'plans' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING_PLANS.map((plan) => {
                const isCurrent = currentPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-5 flex flex-col justify-between transition ${
                      plan.recommended
                        ? 'bg-[#191921] border-2 border-[#d4af37]'
                        : 'bg-[#0e0e12] border border-white/[0.08] hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#807a72] uppercase tracking-wider">
                          {plan.nameEn}
                        </span>
                        {plan.recommended ? (
                          <span className="text-[11px] font-bold text-[#d4af37]">জনপ্রিয়</span>
                        ) : isCurrent ? (
                          <span className="text-[11px] font-semibold text-emerald-400">
                            বর্তমান
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-lg font-bold text-[#f5f3ee] mt-1">{plan.name}</h3>

                      <div className="mt-4 pb-4 border-b border-white/[0.08]">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold text-[#f2d77d] tabular-nums">
                            ৳{toBengaliNumber(plan.price)}
                          </span>
                          <span className="text-xs text-[#807a72]">
                            {plan.price === 0 ? '/ আজীবন' : '/ ১ মাস'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-emerald-400 mt-1.5 tabular-nums">
                          {plan.dailyPosterLimit === -1
                            ? 'আনলিমিটেড পোস্টার (সীমাহীন)'
                            : `প্রতিদিন ${toBengaliNumber(plan.dailyPosterLimit)} টি পোস্টার`}
                        </p>
                      </div>

                      <ul className="space-y-2.5 mt-4 text-xs text-[#b6b0a6]">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.08]">
                      {plan.id === 'free' ? (
                        <div className="py-2.5 text-center text-xs text-[#807a72] bg-[#141419] rounded-xl border border-white/[0.06]">
                          ডিফল্ট ফ্রি অ্যাক্সেস
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartUpgrade(plan.id as 'pro' | 'enterprise')}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition min-h-[42px] ${
                            plan.recommended
                              ? 'bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e]'
                              : 'bg-[#1b1b22] hover:bg-[#24242d] text-[#f2d77d] border border-[#d4af37]/30'
                          }`}
                        >
                          <span>
                            {plan.id === 'pro'
                              ? '১৯৯ টাকায় আপগ্রেড'
                              : '৪৯৯ টাকায় আনলিমিটেড'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* bKash Info Row */}
            <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 font-bold text-xs shrink-0">
                  বিকাশ
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#f5f3ee]">
                    পার্সোনাল সেন্ড মানি:{' '}
                    <span className="font-mono text-pink-300 tabular-nums">
                      {BKASH_CONFIG.number}
                    </span>
                  </h4>
                  <p className="text-xs text-[#807a72] mt-0.5">
                    সেন্ড মানি করে ট্রানজেকশন আইডি ও স্ক্রিনশট জমা দিলেই সুপার এডমিন প্যাকেজ চালু করবেন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b22] hover:bg-[#24242d] text-[#f2d77d] border border-white/10 text-xs font-semibold transition shrink-0 min-h-[40px]"
              >
                {copiedNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                )}
                <span>{copiedNumber ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {submissionSuccess ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0e0e12] border border-emerald-500/25 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
                  <FileCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#f5f3ee]">
                  পেমেন্ট তথ্য সফলভাবে জমা হয়েছে
                </h3>
                <p className="text-xs text-[#b6b0a6] leading-relaxed max-w-md mx-auto">
                  আপনার ট্রানজেকশন আইডি ও স্ক্রিনশট সুপার এডমিনের কন্ট্রোল প্যানেলে পৌঁছে গেছে। যাচাইয়ের পর{' '}
                  <span className="text-[#f2d77d] font-semibold">{currentPlanConfig.name}</span> প্যাকেজ ১ মাসের জন্য সক্রিয় করা হবে।
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-xs transition min-h-[42px]"
                  >
                    ঠিক আছে
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setStep('plans')}
                    className="text-xs text-[#b6b0a6] hover:text-[#f5f3ee] inline-flex items-center gap-1.5 transition min-h-[36px]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>প্যাকেজ তালিকায় ফিরুন</span>
                  </button>
                  <span className="text-xs text-[#f2d77d] font-bold tabular-nums">
                    {currentPlanConfig.name} · ৳{toBengaliNumber(currentPlanConfig.price)}
                  </span>
                </div>

                {/* Instructions */}
                <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-pink-400">বিকাশ সেন্ড মানি নির্দেশনা</span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/25 text-xs font-semibold hover:bg-pink-500/20 transition"
                    >
                      {copiedNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="font-mono tabular-nums">{BKASH_CONFIG.number}</span>
                    </button>
                  </div>

                  <ol className="space-y-1.5 text-xs text-[#b6b0a6] list-decimal list-inside leading-relaxed">
                    {BKASH_CONFIG.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bkash-sender-phone"
                      className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
                    >
                      আপনার বিকাশ নম্বর *
                    </label>
                    <input
                      id="bkash-sender-phone"
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="যেমন: 017xxxxxxxx"
                      required
                      className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] focus:border-[#d4af37] outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bkash-trx-id"
                      className="text-xs font-semibold text-[#b6b0a6] block mb-1.5"
                    >
                      ট্রানজেকশন আইডি (TrxID) *
                    </label>
                    <input
                      id="bkash-trx-id"
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      placeholder="যেমন: BL19XA7K89"
                      required
                      className="w-full px-3.5 py-2.5 bg-[#0e0e12] border border-white/10 rounded-xl text-sm text-[#f5f3ee] font-mono tracking-wider focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="text-xs font-semibold text-[#b6b0a6] block mb-1.5">
                    পেমেন্ট স্ক্রিনশট (ঐচ্ছিক, দ্রুত ভেরিফিকেশনের জন্য)
                  </label>
                  <div className="p-4 rounded-xl bg-[#0e0e12] border border-dashed border-white/15 hover:border-[#d4af37]/50 transition text-center">
                    {screenshotDataUrl ? (
                      <div className="flex items-center justify-between gap-3">
                        <img
                          src={screenshotDataUrl}
                          alt="Payment Screenshot"
                          className="w-16 h-16 object-cover rounded-lg border border-white/10"
                        />
                        <div className="text-left flex-1 min-w-0">
                          <span className="text-xs text-emerald-400 font-semibold block">
                            স্ক্রিনশট যুক্ত হয়েছে
                          </span>
                          <span className="text-[11px] text-[#807a72] block">
                            পরিবর্তন করতে ডানপাশের বাটনে ক্লিক করুন
                          </span>
                        </div>
                        <label className="px-3 py-2 rounded-lg bg-[#1b1b22] text-[#f2d77d] text-xs font-semibold cursor-pointer border border-white/10">
                          পরিবর্তন
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                        <Upload className="w-6 h-6 text-[#d4af37] mb-2" />
                        <span className="text-xs font-semibold text-[#f5f3ee]">
                          {isCompressingScreenshot
                            ? 'ছবি অপটিমাইজ হচ্ছে...'
                            : 'স্ক্রিনশট ছবি নির্বাচন করুন'}
                        </span>
                        <span className="text-[11px] text-[#807a72] mt-0.5">
                          PNG, JPG বা JPEG
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Account summary */}
                <div className="p-3 rounded-xl bg-[#0e0e12] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-[#b6b0a6]">
                  <span>
                    একাউন্ট:{' '}
                    <strong className="text-[#f5f3ee]">
                      {currentUser?.email || 'user@example.com'}
                    </strong>
                  </span>
                  <span className="tabular-nums">
                    পরিমাণ:{' '}
                    <strong className="text-[#f2d77d]">
                      ৳{toBengaliNumber(currentPlanConfig.price)}
                    </strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isCompressingScreenshot}
                  className="w-full py-3 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e3be47] text-[#0b0b0e] font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>
                    {isSubmitting ? 'সাবমিট হচ্ছে...' : 'পেমেন্ট তথ্য সাবমিট করুন'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
};
