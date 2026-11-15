import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PRICING_PLANS, BKASH_CONFIG } from '../data/pricingPlans';
import {
  submitPaymentUpgradeRequest,
  fetchUserUpgradeRequests,
} from '../services/firebaseDb';
import { toBengaliNumber } from '../utils/bengaliUtils';
import {
  isValidBdMobileNumber,
  normalizeBdMobileNumber,
  isValidTransactionId,
  normalizeTransactionId,
} from '../utils/paymentValidation';
import { PaymentUpgradeRequest } from '../types';
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
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  X,
  Loader2,
  Receipt,
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
    paymentSettings,
    brand,
  } = useApp();

  const [step, setStep] = useState<'plans' | 'payment'>('plans');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isCompressingScreenshot, setIsCompressingScreenshot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    requestId: string;
    trxId: string;
    sender: string;
    receiver: string;
    amount: number;
    planName: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ sender?: string; trxId?: string }>({});
  const [myRequests, setMyRequests] = useState<PaymentUpgradeRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const currentPlanConfig =
    PRICING_PLANS.find((p) => p.id === selectedUpgradePlan) || PRICING_PLANS[1];

  const activeBkashNumber = paymentSettings?.bkashNumber || BKASH_CONFIG.defaultNumber;
  const isPaymentEnabled = paymentSettings?.paymentEnabled !== false;
  const checkoutSteps = BKASH_CONFIG.getInstructions(
    activeBkashNumber,
    currentPlanConfig.price
  );

  // Load current user's payment request history when modal opens
  useEffect(() => {
    if (!isPricingModalOpen || !currentUser) {
      return;
    }
    let active = true;
    setLoadingHistory(true);
    fetchUserUpgradeRequests(currentUser.uid)
      .then((list) => {
        if (active) setMyRequests(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [isPricingModalOpen, currentUser?.uid, submissionSuccess]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(activeBkashNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
    showToast('বিকাশ নম্বর কপি করা হয়েছে: ' + activeBkashNumber);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingScreenshot(true);
    setFormError(null);
    try {
      let optimized = await compressScreenshot(file, 900, 0.7);
      if (optimized.length > 900000) {
        optimized = await compressScreenshot(file, 650, 0.5);
      }
      if (optimized.length > 950000) {
        showToast('স্ক্রিনশটের ফাইল সাইজ অনেক বড়, অনুগ্রহ করে ছোট ছবি নির্বাচন করুন');
        return;
      }
      setScreenshotDataUrl(optimized);
      showToast('পেমেন্ট স্ক্রিনশট অপটিমাইজ করে যুক্ত করা হয়েছে');
    } catch (err) {
      console.warn('Screenshot compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result && result.length > 950000) {
          showToast('স্ক্রিনশটের ফাইল সাইজ অনেক বড়, অনুগ্রহ করে ছোট ছবি নির্বাচন করুন');
          return;
        }
        setScreenshotDataUrl(result);
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
    setFormError(null);
    setFieldErrors({});
    setSubmissionSuccess(null);
    setSelectedUpgradePlan(planId);
    setStep('payment');
  };

  const validateForm = (): boolean => {
    const nextErrors: { sender?: string; trxId?: string } = {};
    const normalizedPhone = normalizeBdMobileNumber(senderNumber);
    const normalizedTrx = normalizeTransactionId(transactionId);

    if (!senderNumber.trim()) {
      nextErrors.sender = 'আপনার বিকাশ নম্বর দিন';
    } else if (!isValidBdMobileNumber(normalizedPhone)) {
      nextErrors.sender = 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }

    if (!transactionId.trim()) {
      nextErrors.trxId = 'বিকাশ ট্রানজেকশন আইডি (Trx ID) দিন';
    } else if (!isValidTransactionId(normalizedTrx)) {
      nextErrors.trxId = 'সঠিক Trx ID লিখুন (কমপক্ষে ৪ অক্ষর, শুধু ইংরেজি অক্ষর ও সংখ্যা)';
    } else if (
      myRequests.some((r) => normalizeTransactionId(r.transactionId || '') === normalizedTrx)
    ) {
      nextErrors.trxId = 'এই Trx ID দিয়ে আপনি ইতিমধ্যেই রিকোয়েস্ট জমা দিয়েছেন';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    if (!currentUser) {
      setFormError('সেশন মেয়াদোত্তীর্ণ হয়েছে, অনুগ্রহ করে পুনরায় লগইন করুন।');
      return;
    }

    if (!isPaymentEnabled) {
      setFormError('বিকাশ পেমেন্ট বর্তমানে সাময়িকভাবে বন্ধ আছে।');
      return;
    }

    if (selectedUpgradePlan !== 'pro' && selectedUpgradePlan !== 'enterprise') {
      setFormError('অবৈধ প্যাকেজ নির্বাচন করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      return;
    }

    if (!validateForm()) {
      return;
    }

    const normalizedPhone = normalizeBdMobileNumber(senderNumber);
    const normalizedTrx = normalizeTransactionId(transactionId);

    setIsSubmitting(true);
    try {
      const requestId = await submitPaymentUpgradeRequest({
        userId: currentUser.uid,
        userEmail: currentUser.email || 'user@example.com',
        userName: currentUser.displayName || userProfile?.displayName || 'ব্যবহারকারী',
        planId: selectedUpgradePlan,
        planName: currentPlanConfig.name,
        targetPlan: selectedUpgradePlan,
        amount: currentPlanConfig.price,
        currency: 'BDT',
        paymentMethod: 'bkash',
        receiverNumberAtSubmission: activeBkashNumber,
        senderNumber: normalizedPhone,
        senderPhone: normalizedPhone,
        transactionId: normalizedTrx,
        ...(screenshotDataUrl ? { screenshotUrl: screenshotDataUrl } : {}),
      });

      setSubmissionSuccess({
        requestId,
        trxId: normalizedTrx,
        sender: normalizedPhone,
        receiver: activeBkashNumber,
        amount: currentPlanConfig.price,
        planName: currentPlanConfig.name,
      });
      showToast('পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! সুপার এডমিন যাচাই করে অ্যাক্টিভেট করবেন।');
    } catch (err: any) {
      console.error('Failed to submit payment upgrade:', err);
      const code = String(err?.message || '');
      if (code === 'DUPLICATE_TRX_ID') {
        setFieldErrors((prev) => ({
          ...prev,
          trxId: 'এই ট্রানজেকশন আইডি (Trx ID) ইতিমধ্যেই ব্যবহৃত হয়েছে!',
        }));
        setFormError('ডুপ্লিকেট Trx ID গ্রহণযোগ্য নয়। আপনার আসল বিকাশ Trx ID ব্যবহার করুন।');
      } else if (code === 'INVALID_SENDER_PHONE') {
        setFieldErrors((prev) => ({
          ...prev,
          sender: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (013-019 দিয়ে ১১ সংখ্যা)',
        }));
      } else if (code === 'INVALID_TRX_ID') {
        setFieldErrors((prev) => ({
          ...prev,
          trxId: 'সঠিক ট্রানজেকশন আইডি (Trx ID) লিখুন',
        }));
      } else if (code === 'PAYMENT_DISABLED') {
        setFormError('বিকাশ পেমেন্ট বর্তমানে সাময়িকভাবে বন্ধ রয়েছে।');
      } else {
        setFormError('পেমেন্ট রিকোয়েস্ট সাবমিট করা যায়নি। ইন্টারনেট সংযোগ ও তথ্য যাচাই করে আবার চেষ্টা করুন।');
      }
      showToast('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsPricingModalOpen(false);
    setStep('plans');
    setSubmissionSuccess(null);
    setSenderNumber('');
    setTransactionId('');
    setScreenshotDataUrl(null);
    setFormError(null);
    setFieldErrors({});
  };

  // Render Step 2: bKash Pink/Magenta Header + White Payment Card Checkout
  if (isPricingModalOpen && step === 'payment') {
    return (
      <ModalShell
        isOpen={isPricingModalOpen}
        onClose={handleClose}
        hideHeader
        maxWidthClass="max-w-lg"
      >
        <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          {/* bKash Pink / Magenta Checkout Header */}
          <div className="bg-gradient-to-br from-[#E2136E] via-[#D11064] to-[#B00C52] text-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    setStep('plans');
                    setSubmissionSuccess(null);
                    setFormError(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>প্যাকেজ</span>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/95 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={brand.logo || '/logo.svg'}
                    alt={brand.name || 'WAZ MEDIA'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm tracking-wide block truncate">
                    {brand.name || 'WAZ MEDIA'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="বন্ধ করুন"
                className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant / Plan & Total Amount Strip */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-white/15 border border-white/25 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] text-pink-100 block">প্যাকেজ ও অ্যাকাউন্ট</span>
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {currentPlanConfig.name} · ১ মাস
                </div>
                <div className="text-[11px] text-pink-100 font-mono truncate mt-0.5">
                  {currentUser?.email || ''}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-pink-100 block">মোট পরিমাণ</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">
                  ৳{toBengaliNumber(currentPlanConfig.price)}{' '}
                  <span className="text-xs font-semibold">BDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* White Payment Card Body */}
          <div className="p-5 sm:p-6 bg-white text-slate-800 space-y-5">
            {submissionSuccess ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <FileCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    পেমেন্ট তথ্য সফলভাবে জমা হয়েছে
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto mt-1.5">
                    সুপার এডমিন যাচাই করে আপনার{' '}
                    <strong className="text-[#E2136E]">{submissionSuccess.planName}</strong> প্যাকেজ
                    ১ মাসের জন্য সক্রিয় করে দেবেন।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-900">
                      {submissionSuccess.trxId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">আপনার বিকাশ নম্বর</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {submissionSuccess.sender}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্রাপক নম্বর</span>
                    <span className="font-mono font-semibold text-[#C20E5E] tabular-nums">
                      {submissionSuccess.receiver}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500">পরিমাণ</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      ৳{toBengaliNumber(submissionSuccess.amount)} BDT
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-5 rounded-xl bg-[#E2136E] hover:bg-[#C20E5E] text-white font-bold text-sm transition min-h-[44px]"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4" noValidate>
                {!isPaymentEnabled && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      বিকাশ ম্যানুয়াল পেমেন্ট বর্তমানে সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।
                    </span>
                  </div>
                )}

                {/* Dynamic Receiver bKash Number Box */}
                <div className="p-4 rounded-xl bg-[#FDF2F7] border border-[#E2136E]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#B80D58] block">
                      প্রাপক বিকাশ নম্বর (Send Money · Personal)
                    </span>
                    <div
                      data-testid="checkout-receiver-number"
                      className="text-xl sm:text-2xl font-extrabold font-mono tracking-wider text-slate-900 tabular-nums mt-0.5"
                    >
                      {activeBkashNumber}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E2136E] hover:bg-[#C20E5E] text-white text-xs font-bold transition shadow-sm shrink-0 min-h-[42px]"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>নম্বর কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Clear 4-Step Payment Instructions */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold text-slate-800">
                    পেমেন্ট করার ধাপসমূহ (Payment Instructions)
                  </div>
                  <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
                    {checkoutSteps.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ol>
                </div>

                {/* Required Form Fields */}
                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="bkash-sender-phone"
                      className="text-xs font-bold text-slate-700 block mb-1.5"
                    >
                      আপনার বিকাশ নম্বর (Your Sender Number) *
                    </label>
                    <input
                      id="bkash-sender-phone"
                      type="tel"
                      inputMode="tel"
                      value={senderNumber}
                      onChange={(e) => {
                        setSenderNumber(e.target.value);
                        if (fieldErrors.sender) setFieldErrors((p) => ({ ...p, sender: undefined }));
                      }}
                      placeholder="017XXXXXXXX"
                      required
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-900 font-mono placeholder:text-slate-400 outline-none transition min-h-[44px] ${
                        fieldErrors.sender
                          ? 'border-rose-500 focus:border-rose-600'
                          : 'border-slate-300 focus:border-[#E2136E]'
                      }`}
                    />
                    {fieldErrors.sender && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        {fieldErrors.sender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bkash-trx-id"
                      className="text-xs font-bold text-slate-700 block mb-1.5"
                    >
                      ট্রানজেকশন আইডি (Transaction ID / Trx ID) *
                    </label>
                    <input
                      id="bkash-trx-id"
                      type="text"
                      value={transactionId}
                      onChange={(e) => {
                        setTransactionId(e.target.value.toUpperCase());
                        if (fieldErrors.trxId) setFieldErrors((p) => ({ ...p, trxId: undefined }));
                      }}
                      placeholder="যেমন: BL19XA7K89"
                      required
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-900 font-mono tracking-wider placeholder:text-slate-400 outline-none transition min-h-[44px] ${
                        fieldErrors.trxId
                          ? 'border-rose-500 focus:border-rose-600'
                          : 'border-slate-300 focus:border-[#E2136E]'
                      }`}
                    />
                    {fieldErrors.trxId && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        {fieldErrors.trxId}
                      </p>
                    )}
                  </div>

                  {/* Optional Screenshot Upload (preserves existing verification flow) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      পেমেন্ট স্ক্রিনশট (ঐচ্ছিক, দ্রুত ভেরিফিকেশনের জন্য)
                    </label>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 hover:border-[#E2136E]/60 transition text-center">
                      {screenshotDataUrl ? (
                        <div className="flex items-center justify-between gap-3">
                          <img
                            src={screenshotDataUrl}
                            alt="Payment Screenshot"
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-xs text-emerald-700 font-bold block">
                              স্ক্রিনশট যুক্ত হয়েছে
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              পরিবর্তন করতে ডানপাশের বাটনে ক্লিক করুন
                            </span>
                          </div>
                          <label className="px-3 py-2 rounded-lg bg-white text-[#E2136E] text-xs font-bold cursor-pointer border border-slate-300 hover:bg-slate-100">
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
                        <label className="flex items-center justify-center gap-2.5 cursor-pointer py-1.5">
                          <Upload className="w-4 h-4 text-[#E2136E] shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">
                            {isCompressingScreenshot
                              ? 'ছবি অপটিমাইজ হচ্ছে...'
                              : 'স্ক্রিনশট ছবি নির্বাচন করুন (PNG / JPG)'}
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
                </div>

                {/* Security Warning */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-[#E2136E] shrink-0" />
                  <span>কখনোই আপনার বিকাশ PIN, OTP বা পাসওয়ার্ড শেয়ার করবেন না।</span>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Action Buttons: Cancel & Confirm Payment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleClose}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition disabled:opacity-50 min-h-[44px]"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isCompressingScreenshot || !isPaymentEnabled}
                    className="py-3 px-4 rounded-xl bg-[#E2136E] hover:bg-[#C20E5E] text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>প্রসেসিং...</span>
                      </>
                    ) : (
                      <>
                        <span>পেমেন্ট কনফার্ম করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </ModalShell>
    );
  }

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
                      <span className="text-[11px] font-semibold text-emerald-400">বর্তমান</span>
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

        {/* Dynamic bKash Info Row */}
        <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2136E]/15 border border-[#E2136E]/35 flex items-center justify-center text-[#ff4d97] font-bold text-xs shrink-0">
              বিকাশ
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#f5f3ee]">
                পার্সোনাল সেন্ড মানি:{' '}
                <span className="font-mono text-[#ff66a6] tabular-nums">{activeBkashNumber}</span>
              </h4>
              <p className="text-xs text-[#807a72] mt-0.5">
                {isPaymentEnabled
                  ? 'উপরের প্যাকেজ নির্বাচন করে বিকাশ চেকআউটে Trx ID জমা দিলে সুপার এডমিন প্যাকেজ চালু করবেন।'
                  : 'বিকাশ পেমেন্ট বর্তমানে সাময়িকভাবে বন্ধ আছে।'}
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

        {/* User's Recent Payment Request History & Status */}
        {currentUser && (loadingHistory || myRequests.length > 0) && (
          <div className="p-4 rounded-xl bg-[#0e0e12] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f5f3ee]">
              <Receipt className="w-4 h-4 text-[#d4af37]" />
              <span>আপনার সাম্প্রতিক পেমেন্ট রিকোয়েস্ট</span>
            </div>

            {loadingHistory ? (
              <div className="text-xs text-[#807a72]">লোড হচ্ছে...</div>
            ) : (
              <div className="space-y-2">
                {myRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#141419] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#f5f3ee]">
                          {req.planName ||
                            (req.targetPlan === 'enterprise' ? 'এন্টারপ্রাইজ' : 'প্রো ক্রিয়েটর')}
                        </span>
                        <span className="text-[#807a72]">·</span>
                        <span className="font-mono text-[#f2d77d]">{req.transactionId}</span>
                        <span className="text-[#807a72]">·</span>
                        <span className="tabular-nums text-[#b6b0a6]">
                          ৳{toBengaliNumber(req.amount)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#807a72] font-mono">
                        প্রাপক: {req.receiverNumberAtSubmission || BKASH_CONFIG.defaultNumber} · প্রেরক:{' '}
                        {req.senderNumber || req.senderPhone}
                      </div>
                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="text-[11px] text-rose-400 mt-1">
                          বাতিলের কারণ: {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                        req.status === 'approved'
                          ? 'text-emerald-400'
                          : req.status === 'rejected'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {req.status === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : req.status === 'rejected' ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {req.status === 'approved'
                          ? 'অনুমোদিত'
                          : req.status === 'rejected'
                          ? 'বাতিল'
                          : 'অপেক্ষমাণ'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
};
