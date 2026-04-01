export const INDIAN_FESTIVALS_2026 = [
  { name: "Gudi Padwa", date: "2026-03-29", type: "Regional" },
  { name: "Eid al-Fitr", date: "2026-03-31", type: "Muslim" },
  { name: "Good Friday", date: "2026-04-03", type: "Christian" },
  { name: "Easter Sunday", date: "2026-04-05", type: "Christian" },
  { name: "Ram Navami", date: "2026-04-06", type: "Hindu" },
  { name: "Baisakhi", date: "2026-04-13", type: "Sikh/Harvest" },
  { name: "Ambedkar Jayanti", date: "2026-04-14", type: "National" },
  { name: "Akshaya Tritiya", date: "2026-04-28", type: "Hindu" },
  { name: "Mother's Day", date: "2026-05-10", type: "Global" },
  { name: "Eid al-Adha", date: "2026-06-07", type: "Muslim" },
  { name: "Independence Day", date: "2026-08-15", type: "National" },
  { name: "Raksha Bandhan", date: "2026-08-09", type: "Hindu" },
  { name: "Ganesh Chaturthi", date: "2026-08-23", type: "Hindu" },
  { name: "Navratri Start", date: "2026-10-09", type: "Hindu" },
  { name: "Dussehra", date: "2026-10-18", type: "Hindu" },
  { name: "Diwali", date: "2026-11-08", type: "Hindu" },
  { name: "Christmas", date: "2026-12-25", type: "Christian" },
  { name: "New Year", date: "2027-01-01", type: "Global" },
];

export function getNext7Days(): string {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(
      d.toLocaleDateString("en-IN", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    );
  }
  return days.join(", ");
}

export function getUpcomingFestivals(days = 30): typeof INDIAN_FESTIVALS_2026 {
  const today = new Date();
  const future = new Date(today);
  future.setDate(today.getDate() + days);
  return INDIAN_FESTIVALS_2026.filter((f) => {
    const d = new Date(f.date);
    return d >= today && d <= future;
  });
}

export function getFestivalUrgency(dateStr: string): string {
  const today = new Date();
  const festivalDate = new Date(dateStr);
  const diffMs = festivalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Today";
  if (diffDays <= 7) return "This Week";
  return "This Month";
}
