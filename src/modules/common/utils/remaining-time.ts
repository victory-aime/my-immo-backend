export function formatRemainingTime(blockUntil: Date): {
  seconds: number;
  message: string;
} {
  const now = new Date();
  const remainingMs = blockUntil.getTime() - now.getTime();
  const seconds = Math.ceil(remainingMs / 1000);
  const formatted = blockUntil.toLocaleTimeString();

  return {
    seconds,
    message: `Trop de tentatives. Réessayez après ${formatted}`,
  };
}
