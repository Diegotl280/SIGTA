// Cantidad de palabras permitidas
export const maxWords = (str: string | undefined | null, limit: number = 500): boolean => {
  if (!str) return true;
  return str.trim().split(/\s+/).length <= limit;
};
