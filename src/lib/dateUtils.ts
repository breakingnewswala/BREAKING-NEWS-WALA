// Hindi Date and Alphanumeric Graphic File Name Utilities

export const HINDI_MONTHS = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितम्बर',
  'अक्टूबर',
  'नवम्बर',
  'दिसम्बर',
];

export const HINDI_DAYS = [
  'रविवार',
  'सोमवार',
  'मंगलवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार',
];

/**
 * Returns date formatted in Hindi exactly as requested:
 * e.g. "5 सितम्बर 2026, शनिवार"
 */
export function getFormattedHindiDate(inputDate?: Date | string | number): string {
  let date: Date;
  if (!inputDate) {
    date = new Date();
  } else if (inputDate instanceof Date) {
    date = inputDate;
  } else {
    date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      date = new Date();
    }
  }

  const day = date.getDate();
  const month = HINDI_MONTHS[date.getMonth()] || '';
  const year = date.getFullYear();
  const dayOfWeek = HINDI_DAYS[date.getDay()] || '';

  return `${day} ${month} ${year}, ${dayOfWeek}`;
}

/**
 * Generates an alphanumeric & digit filename for downloading graphic images in JPG format.
 * Completely eliminates headline text words as requested by the user.
 * Examples: "BNW_20260905_482910.jpg", "BNW_20260905_A7K9482.jpg"
 */
export function generateGraphicDownloadFileName(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${yyyy}${mm}${dd}`;

  // Random 6-digit number + 2-3 alphanumeric uppercase characters
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const alphaChars = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `BNW_${dateSegment}_${alphaChars}${randomDigits}.jpg`;
}
