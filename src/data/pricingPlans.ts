import { PlanLimitInfo } from '../types';

import { INITIAL_BKASH_NUMBER } from '../utils/paymentValidation';

export const BKASH_CONFIG = {
  defaultNumber: INITIAL_BKASH_NUMBER,
  type: 'Personal / Send Money (পার্সোনাল - সেন্ড মানি)',
  getInstructions: (receiverNumber: string, amount?: number) => [
    'Open bKash App — বিকাশ অ্যাপ খুলুন (অথবা *247# ডায়াল করুন)।',
    'Choose Send Money — মেনু থেকে "Send Money" অপশন নির্বাচন করুন।',
    `Enter Receiver Number & Exact Amount — প্রাপক নম্বর (${receiverNumber}) এবং ঠিক ${amount ? `৳${amount} BDT` : 'নির্ধারিত পরিমাণ'} লিখুন।`,
    'Complete Transaction & Copy Trx ID — লেনদেন সম্পন্ন করে ট্রানজেকশন আইডি (Trx ID) কপি করে নিচে সাবমিট করুন।'
  ]
};

export const PRICING_PLANS: PlanLimitInfo[] = [
  {
    id: 'free',
    name: 'ফ্রি প্যাকেজ',
    nameEn: 'Free Starter',
    price: 0,
    period: 'আজীবন / ০ টাকা',
    dailyPosterLimit: 5,
    features: [
      'প্রতিদিন ৫ টি পোস্টার তৈরি ও ডাউনলোড',
      '১,০০০+ সম্পূর্ণ ইসলামিক ভেরিফায়েড বাণী লাইব্রেরি',
      'সহীহ হাদিস ও কুরআন ব্রাউজার অনুসন্ধান',
      '১০৮০x১০৮০ স্কয়ার রেজুলেশন সাপোর্ট',
      'স্ট্যান্ডার্ড গোল্ডেন ও ক্লাসিক ইসলামিক থিম'
    ]

  },
  {
    id: 'pro',
    name: 'প্রো ক্রিয়েটর',
    nameEn: 'Pro Creator',
    price: 199,
    period: '১৯৯ টাকা / ১ মাস',
    dailyPosterLimit: 50,
    recommended: true,
    features: [
      'প্রতিদিন ৫০ টি পোস্টার তৈরি ও এক্সপোর্ট',
      'সব রেশিও (১:১ স্কয়ার, ৪:৫ পোর্ট্রেট, ৯:১৬ স্টোরি)',
      'কাস্টম স্টাইল প্রিসেট সেভিং ও অটো-অ্যাপ্লাই',
      'কাস্টম ব্র্যান্ড লোগো ক্লাউড স্টোরেজে আপলোড',
      'আল্ট্রা এইচডি পিএনজি ও জেপেগ ডাউনলোড',
      '১ মাস নিরবচ্ছিন্ন ক্লাউড এক্সেস'
    ]
  },
  {
    id: 'enterprise',
    name: 'এন্টারপ্রাইজ আনলিমিটেড',
    nameEn: 'Enterprise Unlimited',
    price: 499,
    period: '৪৯৯ টাকা / ১ মাস',
    dailyPosterLimit: -1, // Unlimited
    features: [
      'প্রতিদিন আনলিমিটেড (কোনো লিমিট নেই) পোস্টার তৈরি',
      'সব প্রিমিয়াম ও রয়্যাল থিম আনলকড',
      'মাল্টি-ডিভাইস ও মাল্টি-ব্র্যান্ডিং ব্যবস্থাপনা',
      'সর্বোচ্চ রেজোলিউশন ক্যানভাস রেন্ডারিং',
      'ডেডিকেটেড ভিআইপি সাপোর্ট ও ফাস্ট ট্র্যাকিং',
      '১ মাস ফুল এন্টারপ্রাইজ এক্সেস'
    ]
  }
];
