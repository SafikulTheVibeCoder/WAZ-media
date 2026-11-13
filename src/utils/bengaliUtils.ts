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

export function formatLocalIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayHijriEstimate(): string {
  const months = [
    'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল',
    'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ্জ',
  ];
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(new Date());
    let day = 1;
    let monthIdx = 1;
    let year = 1448;
    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10);
      else if (p.type === 'month') monthIdx = parseInt(p.value, 10);
      else if (p.type === 'year') year = parseInt(p.value, 10);
    }
    const monthName = months[(monthIdx - 1) % 12] || months[0];
    return `${toBengaliNumber(day)} ${monthName}, ${toBengaliNumber(year)} হিজরি`;
  } catch {
    const today = new Date();
    const dayName = today.toLocaleDateString('bn-BD', { weekday: 'long' });
    const day = toBengaliNumber(today.getDate());
    const month = today.toLocaleDateString('bn-BD', { month: 'long' });
    const year = toBengaliNumber(today.getFullYear());
    return `${dayName}, ${day} ${month} ${year} খ্রি.`;
  }
}
