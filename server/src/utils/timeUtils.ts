export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return NaN;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }
  return hours * 60 + minutes;
};

export const generateTimeSlots = (
  startTimeStr: string,
  endTimeStr: string,
  durationMinutes: number
): string[] => {
  const startMinutes = timeToMinutes(startTimeStr);
  const endMinutes = timeToMinutes(endTimeStr);
  const slots: string[] = [];

  if (
    isNaN(startMinutes) ||
    isNaN(endMinutes) ||
    isNaN(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return slots;
  }

  let currentMinutes = startMinutes;
  while (currentMinutes + durationMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    );
    currentMinutes += durationMinutes;
  }

  return slots;
};

export const getDayOfWeekString = (dayNumber: number): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dayNumber];
};
