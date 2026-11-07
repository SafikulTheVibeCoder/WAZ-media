/**
 * Bengali numeral converter and utilities
 */

const EN_TO_BN_NUMBERS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBengaliNumber(num: number | string): string {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (digit) => EN_TO_BN_NUMBERS[digit] || digit);
}

export function formatDateBn(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getTodayHijriEstimate(): string {
  // Approximate Hijri date calculation for demonstration/display
  const today = new Date();
  const hijriYear = 1447;
  const months = [
    'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল',
    'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ্জ'
  ];
  // Format current date in Bengali
  const dayName = today.toLocaleDateString('bn-BD', { weekday: 'long' });
  const day = toBengaliNumber(today.getDate());
  const month = today.toLocaleDateString('bn-BD', { month: 'long' });
  const year = toBengaliNumber(today.getFullYear());

  return `${dayName}, ${day} ${month} ${year} খ্রি.`;
}
