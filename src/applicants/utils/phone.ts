export const normalizeApplicantPhoneNumber = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const strippedValue = value.trim().replace(/[^\d+]/g, '');
  const compactValue = strippedValue.startsWith('+')
    ? `+${strippedValue.slice(1).replace(/\+/g, '')}`
    : strippedValue.replace(/\+/g, '');

  if (/^00[1-9]\d{7,14}$/.test(compactValue)) {
    return `+${compactValue.slice(2)}`;
  }

  if (/^0\d{6,14}$/.test(compactValue)) {
    return compactValue.slice(1);
  }

  if (/^355\d{6,12}$/.test(compactValue)) {
    return `+${compactValue}`;
  }

  return compactValue;
};

export const APPLICANT_PHONE_REGEX = /^(?:[1-9]\d{6,14}|\+[1-9]\d{6,14})$/;
