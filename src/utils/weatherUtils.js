// weatherUtils.js
// Shared display and activity recommendation rules.

export const CITY_OPTIONS = [
  "Chicago",
  "New York",
  "Los Angeles",
  "Miami",
  "Seattle",
];

export const WEATHER_TYPES = [
  "Any",
  "Sunny",
  "Partly Cloudy",
  "Cloudy",
  "Rainy",
  "Snowy",
  "Stormy",
];

export const DAYS_OF_WEEK = [
  "Any",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getSeason(date) {
  const month = date.getMonth();

  if (month >= 2 && month <= 4) {
    return "spring";
  }

  if (month >= 5 && month <= 7) {
    return "summer";
  }

  if (month >= 8 && month <= 10) {
    return "fall";
  }

  return "winter";
}

export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

export function qualifiesForBaseball(
  day,
  city,
  threshold
) {
  return (
    city === "Chicago" &&
    day.temperature > threshold &&
    day.cubsHomeGame &&
    Boolean(day.cubsOpponent)
  );
}

export function qualifiesForSoccer(day, threshold) {
  return (
    day.temperature > threshold &&
    day.weather === "Sunny"
  );
}

// Shows the umbrella recommendation if the forecast is explicitly
// rainy/stormy, if measurable rain is expected, or if Open-Meteo
// reports any non-zero precipitation probability.
//
// Snow-only days are excluded from the probability-only check so a
// snow forecast does not incorrectly become a "chance of rain" alert.
export function qualifiesForUmbrella(day) {
  const rainyWeather =
    day.weather === "Rainy" ||
    day.weather === "Stormy";

  const measurableRain =
    Number(day.rainSum ?? 0) > 0;

  const chanceOfRain =
    day.weather !== "Snowy" &&
    Number(day.precipitationProbability ?? 0) > 0;

  return (
    rainyWeather ||
    measurableRain ||
    chanceOfRain
  );
}

export function qualifiesForCustomRule(day, rule) {
  const temperatureMatches =
    rule.minimumTemperature === "" ||
    day.temperature > Number(rule.minimumTemperature);

  const dayMatches =
    rule.dayOfWeek === "Any" ||
    day.dayName === rule.dayOfWeek;

  const weatherMatches =
    rule.weather === "Any" ||
    day.weather === rule.weather;

  return (
    temperatureMatches &&
    dayMatches &&
    weatherMatches
  );
}
