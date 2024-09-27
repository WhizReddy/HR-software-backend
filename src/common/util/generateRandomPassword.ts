export function generateRandomPassword(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    const randomType = Math.floor(Math.random() * 3);
    if (randomType === 0) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    } else if (randomType === 1) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    } else {
      password += specialChars.charAt(
        Math.floor(Math.random() * specialChars.length),
      );
    }
  }
  return password;
}
