export function generateRandomPassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*';

  // Guarantee one of each type
  let password = '';
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  // Fill the rest of the 16 characters
  const allChars = lower + upper + numbers + specialChars;
  for (let i = 0; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}
