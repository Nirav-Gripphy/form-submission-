export function generate15DigitNumber() {
  // First digit between 1-9 to avoid leading zero
  const firstDigit = Math.floor(Math.random() * 9) + 1;

  // Remaining 14 digits (can include zeros)
  let remainingDigits = "";
  for (let i = 0; i < 14; i++) {
    remainingDigits += Math.floor(Math.random() * 10);
  }

  return firstDigit + remainingDigits;
}
