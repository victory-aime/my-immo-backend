export function formatExpiresIn(seconds: number) {
  if (seconds <= 0) return '0 seconde';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} jour${days > 1 ? 's' : ''}`);
  }

  if (hours > 0) {
    parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  }

  // On affiche les secondes seulement si rien d'autre ou si très court
  if (secs > 0 && parts.length === 0) {
    parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}
