/**
 * Converts time string "HH:MM" to minutes since midnight.
 * @param {string} timeStr - Time string in HH:MM format.
 * @returns {number} Minutes since midnight, or NaN if invalid.
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return NaN;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  )
    return NaN;
  return hours * 60 + minutes;
};

/**
 * Generates an array of time slots (HH:MM strings) between a start and end time, based on duration.
 * @param {string} startTimeStr - Start time in HH:MM format.
 * @param {string} endTimeStr - End time in HH:MM format.
 * @param {number} durationMinutes - Duration of each slot in minutes.
 * @returns {string[]} Array of time slot strings (HH:MM).
 */
const generateTimeSlots = (startTimeStr, endTimeStr, durationMinutes) => {
  const startMinutes = timeToMinutes(startTimeStr);
  const endMinutes = timeToMinutes(endTimeStr);
  const slots = [];

  if (
    isNaN(startMinutes) ||
    isNaN(endMinutes) ||
    isNaN(durationMinutes) ||
    durationMinutes <= 0
  ) {
    console.error("Invalid input for generateTimeSlots:", {
      startTimeStr,
      endTimeStr,
      durationMinutes,
    });
    return slots; // Return empty array on invalid input
  }

  let currentMinutes = startMinutes;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    );
    currentMinutes += durationMinutes;
  }

  return slots;
};

/**
 * Converts a JavaScript Date object's day number (0-6) to a day string.
 * @param {number} dayNumber - Day number (0 for Sunday, 1 for Monday, etc.).
 * @returns {string} Day name string ('Sunday', 'Monday', etc.).
 */
const getDayOfWeekString = (dayNumber) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayNumber];
};

module.exports = {
  timeToMinutes,
  generateTimeSlots,
  getDayOfWeekString,
};
