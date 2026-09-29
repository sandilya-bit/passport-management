/** 9876543210 -> "98765 43210" */
export const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const parts = [digits.slice(0, 5), digits.slice(5)].filter(Boolean);
  return parts.join(' ');
};

/** 123456789012 -> "1234 5678 9012" */
export const maskAadhaar = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/** AB1234567 */
export const maskPassportNumber = (value: string): string => {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
  const letters = raw.slice(0, 2).replace(/[^A-Z]/g, '');
  const digits = raw.slice(2).replace(/\D/g, '');
  return letters + digits;
};

export const maskAmount = (value: string): string =>
  value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

export const maskDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
};

export const maskPincode = (value: string): string => value.replace(/\D/g, '').slice(0, 6);
