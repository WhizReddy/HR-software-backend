import { randomInt } from 'crypto';

const pickRandomChar = (characters: string): string =>
  characters.charAt(randomInt(characters.length));

export function generateRandomPassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*';
  const allChars = lower + upper + numbers + specialChars;
  const passwordCharacters = [
    pickRandomChar(lower),
    pickRandomChar(upper),
    pickRandomChar(numbers),
    pickRandomChar(specialChars),
  ];

  for (let i = 0; i < 12; i++) {
    passwordCharacters.push(pickRandomChar(allChars));
  }

  for (let i = passwordCharacters.length - 1; i > 0; i--) {
    const swapIndex = randomInt(i + 1);
    [passwordCharacters[i], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[i],
    ];
  }

  return passwordCharacters.join('');
}
