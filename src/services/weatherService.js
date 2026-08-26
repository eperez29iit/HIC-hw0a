// weatherService.js
// Fetches seven days of weather data from Open-Meteo.
//
// Open-Meteo does not require an API key for non-commercial use.
// The app uses daily maximum temperature because the activity rules
// are based on whether a day's temperature passes a threshold.

const CITY_LOCATIONS = {
  Chicago: {
    latitude: 41.8781,
    longitude: -87.6298,
  },
  "New York": {
    latitude: 40.7128,
    longitude: -74.006,
  },
  "Los Angeles": {
    latitude: 34.0522,
    longitude: -118.2437,
  },
  Miami: {
    latitude: 25.7617,
    longitude: -80.1918,
  },
  Seattle: {
    latitude: 47.6062,
    longitude: -122.3321,
  },
};

const FORECAST_API =
  "https://api.open-meteo.com/v1/forecast";

const HISTORICAL_API =
  "https://archive-api.open-meteo.com/v1/archive";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// fetchSevenDayWeather
// city: one of the cities in CITY_LOCATIONS
// selectedDate: tester/current date selected by the user
//
// Returns:
// [
//   {
//     date,
//     dateKey,
//     dayName,
//     temperature,
//     weather,
//     weatherCode
//   }
// ]
export async function fetchSevenDayWeather(
  city,
  selectedDate
) {
  const location = CITY_LOCATIONS[city];

  if (!location) {
    throw new Error(`Weather location not configured for ${city}.`);
  }

  const startDate = startOfLocalDay(selectedDate);
  const endDate = addDays(startDate, 6);
  const today = startOfLocalDay(new Date());

  const dayDifference = Math.round(
    (startDate - today) / MILLISECONDS_PER_DAY
  );

  let data;

  // Open-Meteo's live forecast can include up to 92 previous days.
  // Use it for recent dates so the tester can move backward without
  // requiring a second data format.
  if (dayDifference >= -92 && dayDifference <= 9) {
    data = await fetchForecastWeather(
      location,
      startDate,
      endDate,
      dayDifference
    );
  } else if (dayDifference < -92) {
    // Older tester dates use Open-Meteo's historical archive API.
    data = await fetchHistoricalWeather(
      location,
      startDate,
      endDate
    );
  } else {
    // A full seven-day preview can only begin about nine days ahead
    // because the forecast API provides up to sixteen forecast days.
    throw new Error(
      "A full 7-day forecast is not available that far in the future. Choose a date within the next 9 days or a past date."
    );
  }

  return normalizeDailyWeather(data);
}

async function fetchForecastWeather(
  location,
  startDate,
  endDate,
  dayDifference
) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: "temperature_2m_max,weather_code",
    temperature_unit: "fahrenheit",
    timezone: "auto",
    forecast_days: "16",
  });

  // Only request past days when the selected date actually needs them.
  if (dayDifference < 0) {
    params.set(
      "past_days",
      String(Math.min(92, Math.abs(dayDifference)))
    );
  }

  const response = await fetch(
    `${FORECAST_API}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      "Open-Meteo could not load the weather forecast."
    );
  }

  const data = await response.json();

  // The live API returns a larger range. Keep only the requested
  // seven-day tester window.
  return sliceDailyRange(
    data,
    formatDateKey(startDate),
    formatDateKey(endDate)
  );
}

async function fetchHistoricalWeather(
  location,
  startDate,
  endDate
) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    start_date: formatDateKey(startDate),
    end_date: formatDateKey(endDate),
    daily: "temperature_2m_max,weather_code",
    temperature_unit: "fahrenheit",
    timezone: "auto",
  });

  const response = await fetch(
    `${HISTORICAL_API}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      "Open-Meteo could not load weather for the selected date."
    );
  }

  return response.json();
}

function sliceDailyRange(data, startKey, endKey) {
  if (!data?.daily?.time) {
    return data;
  }

  const indexes = data.daily.time
    .map((dateKey, index) => ({
      dateKey,
      index,
    }))
    .filter(
      ({ dateKey }) =>
        dateKey >= startKey && dateKey <= endKey
    )
    .map(({ index }) => index);

  return {
    ...data,
    daily: {
      time: indexes.map(
        (index) => data.daily.time[index]
      ),
      temperature_2m_max: indexes.map(
        (index) => data.daily.temperature_2m_max[index]
      ),
      weather_code: indexes.map(
        (index) => data.daily.weather_code[index]
      ),
    },
  };
}

function normalizeDailyWeather(data) {
  const daily = data?.daily;

  if (
    !daily ||
    !Array.isArray(daily.time) ||
    daily.time.length < 7
  ) {
    throw new Error(
      "The weather API did not return a complete 7-day forecast."
    );
  }

  return daily.time.slice(0, 7).map((dateKey, index) => {
    const date = parseDateKey(dateKey);
    const temperature = daily.temperature_2m_max[index];
    const weatherCode = daily.weather_code[index];

    return {
      date,
      dateKey,
      dayName: date.toLocaleDateString("en-US", {
        weekday: "long",
      }),
      temperature: Math.round(temperature),
      weather: weatherCodeToLabel(weatherCode),
      weatherCode,
    };
  });
}

// Converts Open-Meteo WMO weather codes into the simpler labels
// used by the recommendation rule UI.
export function weatherCodeToLabel(code) {
  if (code === 0 || code === 1) {
    return "Sunny";
  }

  if (code === 2) {
    return "Partly Cloudy";
  }

  if (
    code === 3 ||
    code === 45 ||
    code === 48
  ) {
    return "Cloudy";
  }

  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return "Rainy";
  }

  if (
    (code >= 71 && code <= 77) ||
    code === 85 ||
    code === 86
  ) {
    return "Snowy";
  }

  if (code >= 95 && code <= 99) {
    return "Stormy";
  }

  return "Cloudy";
}

function startOfLocalDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}
