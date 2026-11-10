import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRICING_PLANS, BKASH_CONFIG } from '../data/pricingPlans';
import { submitPaymentUpgradeRequest } from '../services/firebaseDb';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  X,
  CheckCircle2,
  Sparkles,
  Crown,
  Upload,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  PhoneCall,
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

  if (!isPricingModalOpen) return null;

  const currentPlanConfig = PRICING_PLANS.find((p) => p.id === selectedUpgradePlan) || PRICING_PLANS[1];

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
      // Compress and optimize screenshot to ensure fast transfer and strict Firestore limits
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#140e0a] border border-[#3b2a1a] rounded-3xl p-5 sm:p-7 shadow-2xl text-[#f4eee2] overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        {/* Modal Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#1f1610] hover:bg-[#2b1f16] border border-[#38281b] flex items-center justify-center text-[#9b8976] hover:text-[#f4eee2] transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#8c6d1f]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#f7df94] shadow-inner">
            <Crown className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#f7df94]">
                ওয়াজ মিডিয়া স্টুডিও প্রাইসিং ও প্যাকেজ
              </h2>
              <span className="text-[11px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                বিকাশ ইনস্ট্যান্ট আপগ্রেড
              </span>
            </div>
            <p className="text-xs text-[#9b8976] mt-0.5">
              ১ মাসের পূর্ণ এক্সেস নিন এবং প্রতিদিন যত খুশি পোস্টার বানিয়ে আপনার পেইজকে সমৃদ্ধ করুন
            </p>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-6">
          {step === 'plans' ? (
            /* STEP 1: PLANS COMPARISON */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PRICING_PLANS.map((plan) => {
                  const isCurrent = currentPlan === plan.id;
                  const isPro = plan.id === 'pro';
                  const isEnterprise = plan.id === 'enterprise';

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all ${
                        plan.recommended
                          ? 'bg-gradient-to-b from-[#241a12] to-[#16100b] border-2 border-[#d4af37] shadow-xl shadow-[#d4af37]/10'
                          : 'bg-[#18110b] border border-[#2d2117] hover:border-[#443120]'
                      }`}
                    >
                      {plan.recommended && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] font-bold text-[10px] uppercase tracking-wider shadow">
                          সর্বাধিক জনপ্রিয়
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#a6927d] uppercase tracking-wider">
                            {plan.nameEn}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              বর্তমান প্যাকেজ
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-[#f4eee2] mt-1">{plan.name}</h3>

                        {/* Price */}
                        <div className="mt-4 pb-4 border-b border-[#2d2117]">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-[#f7df94]">
                              ৳ {toBengaliNumber(plan.price)}
                            </span>
                            <span className="text-xs text-[#877461]">
                              {plan.price === 0 ? '/ ফ্রি আজীবন' : '/ ১ মাস মেয়াদের জন্য'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>
                              {plan.dailyPosterLimit === -1
                                ? 'দৈনিক লিমিট: আনলিমিটেড (কোনো সীমা নেই)'
                                : `দৈনিক লিমিট: প্রতিদিন ${toBengaliNumber(plan.dailyPosterLimit)}টি পোস্টার`}
                            </span>
                          </div>
                        </div>

                        {/* Features list */}
                        <ul className="space-y-2.5 mt-5 text-xs text-[#c9b7a3]">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Button */}
                      <div className="mt-6 pt-4 border-t border-[#2d2117]">
                        {plan.id === 'free' ? (
                          <div className="py-2.5 text-center text-xs text-[#877461] bg-[#140e0a] rounded-xl border border-[#261b12]">
                            ডিফল্ট ফ্রি অ্যাক্সেস
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartUpgrade(plan.id as 'pro' | 'enterprise')}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md ${
                              plan.recommended
                                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a]'
                                : 'bg-[#261c13] hover:bg-[#34261a] text-[#f7df94] border border-[#d4af37]/40'
                            }`}
                          >
                            <span>
                              {plan.id === 'pro'
                                ? '১৯৯ টাকায় প্রো আপগ্রেড করুন'
                                : '৪৯৯ টাকায় আনলিমিটেড নিন'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* bKash Highlight Note */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#21140d] via-[#1c120a] to-[#21140d] border border-[#44301d] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-950/80 border border-pink-700/60 flex items-center justify-center text-pink-400 font-bold text-sm shrink-0">
                    বিকাশ
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#f7df94]">বিকাশ পার্সোনাল নম্বর: {BKASH_CONFIG.number}</h4>
                    <p className="text-xs text-[#baa791]">
                      টাকা পাঠিয়ে ট্রানজেকশন আইডি ও স্ক্রিনশট দিলেই সুপার এডমিন দ্রুত একাউন্ট সক্রিয় করবেন।
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2a1d13] hover:bg-[#362518] text-[#f7df94] border border-[#4d361c] text-xs font-semibold transition shrink-0"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
                  <span>{copiedNumber ? 'কপি হয়েছে' : 'নম্বর কপি করুন'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: PAYMENT SUBMISSION */
            <div className="max-w-2xl mx-auto space-y-6">
              {submissionSuccess ? (
                /* Success Screen */
                <div className="p-8 rounded-3xl bg-[#18110b] border border-emerald-800/60 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                    <FileCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#f7df94]">পেমেন্ট তথ্য সফলভাবে জমা হয়েছে!</h3>
                  <p className="text-xs text-[#baa791] leading-relaxed max-w-md mx-auto">
                    আপনার ট্রানজেকশন আইডি ও স্ক্রিনশট সুপার এডমিনের কন্ট্রোল প্যানেলে পৌঁছে গেছে। যাচাই সম্পন্ন হওয়া মাত্র আপনার প্যাকেজ <span className="text-[#f7df94] font-semibold">{currentPlanConfig.name}</span>-এ ১ মাসের জন্য স্বয়ংক্রিয়ভাবে আপগ্রেড হয়ে যাবে।
                  </p>
                  <div className="p-3 rounded-xl bg-[#120e0a] border border-[#2b1f15] text-xs text-[#877461] max-w-sm mx-auto">
                    যেকোনো প্রয়োজনে যোগাযোগ করুন: realsafikul@gmail.com
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] text-[#140e0a] font-bold text-xs shadow transition"
                    >
                      ঠিক আছে
                    </button>
                  </div>
                </div>
              ) : (
                /* Form Screen */
                <form onSubmit={handleSubmitPayment} className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2d2117]">
                    <button
                      type="button"
                      onClick={() => setStep('plans')}
                      className="text-xs text-[#baa791] hover:text-[#f7df94] flex items-center gap-1 transition"
                    >
                      ← প্যাকেজ তালিকায় ফিরে যান
                    </button>
                    <span className="text-xs text-[#d4af37] font-bold">
                      নির্বাচিত: {currentPlanConfig.name} (৳ {toBengaliNumber(currentPlanConfig.price)})
                    </span>
                  </div>

                  {/* Payment Instructions Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#20150d] to-[#17100a] border border-[#44301d] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wide flex items-center gap-2">
                        <span>বিকাশ সেন্ড মানি নির্দেশনা</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-950/70 text-pink-300 border border-pink-800/60 text-xs font-semibold hover:bg-pink-900/60 transition"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>নম্বর: {BKASH_CONFIG.number}</span>
                      </button>
                    </div>

                    <ol className="space-y-1.5 text-xs text-[#baa791] list-decimal list-inside leading-relaxed">
                      {BKASH_CONFIG.instructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#baa791] block mb-1">
                        আপনার বিকাশ নম্বর (যেখান থেকে টাকা পাঠিয়েছেন) *
                      </label>
                      <input
                        type="text"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="যেমন: 017xxxxxxxx"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] focus:border-[#d4af37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#baa791] block mb-1">
                        বিকাশ ট্রানজেকশন আইডি (TrxID) *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                        placeholder="যেমন: BL19XA7K89"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#120e0a] border border-[#2d2117] rounded-xl text-sm text-[#f4eee2] font-mono tracking-wider focus:border-[#d4af37] outline-none"
                      />
                    </div>
                  </div>

                  {/* Screenshot Upload Field */}
                  <div>
                    <label className="text-xs font-semibold text-[#baa791] block mb-1">
                      পেমেন্টের স্ক্রিনশট আপলোড করুন (বাধ্যতামূলক নয়, তবে দ্রুত ভেরিফিকেশনে সহায়ক)
                    </label>
                    <div className="p-4 rounded-xl bg-[#120e0a] border border-dashed border-[#3d2a1a] hover:border-[#d4af37]/60 transition text-center">
                      {screenshotDataUrl ? (
                        <div className="flex items-center justify-between gap-3">
                          <img
                            src={screenshotDataUrl}
                            alt="Screenshot"
                            className="w-20 h-20 object-cover rounded-lg border border-[#44301d]"
                          />
                          <div className="text-left flex-1">
                            <span className="text-xs text-emerald-400 font-semibold block">
                              স্ক্রিনশট সফলভাবে যুক্ত হয়েছে
                            </span>
                            <span className="text-[11px] text-[#877461]">
                              প্রয়োজনে পরিবর্তন করতে আবার ফাইলে ক্লিক করুন
                            </span>
                          </div>
                          <label className="px-3 py-1.5 rounded-lg bg-[#241a12] text-[#f7df94] text-xs font-semibold cursor-pointer border border-[#3b291a]">
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
                          <Upload className="w-7 h-7 text-[#d4af37] mb-2" />
                          <span className="text-xs font-semibold text-[#f7df94]">
                            স্ক্রিনশট ছবি নির্বাচন করুন
                          </span>
                          <span className="text-[11px] text-[#877461] mt-0.5">
                            PNG, JPG বা JPEG (সর্বোচ্চ ২ মেগাবাইট)
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

                  {/* User confirmation reminder */}
                  <div className="p-3 rounded-xl bg-[#18110b] border border-[#2d2117] flex items-center justify-between text-xs text-[#baa791]">
                    <span>আপনার একাউন্ট: <strong className="text-[#f7df94]">{currentUser?.email || 'user@example.com'}</strong></span>
                    <span>পরিশোধের পরিমাণ: <strong className="text-[#f7df94]">৳ {toBengaliNumber(currentPlanConfig.price)}</strong></span>
                  </div>


                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38927] hover:from-[#e3be47] hover:to-[#c69a30] text-[#140e0a] font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? 'তথ্য যাচাই ও সাবমিট হচ্ছে...' : 'পেমেন্ট তথ্য সাবমিট করুন'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
