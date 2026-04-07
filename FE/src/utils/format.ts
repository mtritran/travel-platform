export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const getFileUrl = (path: string | undefined): string => {
  if (!path) return '';
  return `http://localhost:8080/files?path=${path}`;
};
