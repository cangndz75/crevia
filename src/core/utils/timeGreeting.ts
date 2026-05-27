export type TimeGreeting = {
  title: string;
  emoji: string;
};

export function getTimeGreeting(date = new Date()): TimeGreeting {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return { title: 'Günaydın', emoji: '☀️' };
  }
  if (hour >= 12 && hour < 18) {
    return { title: 'İyi Günler', emoji: '🌤️' };
  }
  return { title: 'İyi Akşamlar', emoji: '🌙' };
}
