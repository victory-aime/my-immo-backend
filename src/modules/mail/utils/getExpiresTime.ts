export function formatExpiresIn(seconds: number) {
  if (seconds < 60) {
    return `${seconds} secondes`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} minutes`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  return minutes === 0
    ? `${hours} heure${hours > 1 ? 's' : ''}`
    : `${hours}h ${minutes}min`;
}
