// App.jsx
// Main weather dashboard screen.
// Loads real weather data from Open-Meteo and combines it with
// the Cubs schedule CSV stored in src/public.

import { useEffect, useMemo, useState } from "react";

import ForecastList from "./components/ForecastList";
import TesterSettings from "./components/TesterSettings";

import {
  CITY_OPTIONS,
  getSeason,
  qualifiesForBaseball,
  qualifiesForSoccer,
  qualifiesForCustomRule,
} from "./utils/weatherUtils";

import { fetchSevenDayWeather } from "./services/weatherService";
import { getCubsHomeGame } from "./services/cubsScheduleService";

import "./App.css";

function App() {
  const [city, setCity] = useState("Chicago");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [baseballThreshold, setBaseballThreshold] = useState(70);
  const [soccerThreshold, setSoccerThreshold] = useState(70);
  const [customRules, setCustomRules] = useState([]);

  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");

  const season = getSeason(selectedDate);

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Reload weather whenever the selected city or tester date changes.
  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError("");

      try {
        const weatherDays = await fetchSevenDayWeather(
          city,
          selectedDate
        );

        // Add Cubs home-game information to each weather day.
        // The CSV parser returns null when there is no "Opponent at Cubs"
        // entry for that date.
        const combinedDays = weatherDays.map((day) => {
          const cubsGame = getCubsHomeGame(day.dateKey);

          return {
            ...day,
            cubsHomeGame: Boolean(cubsGame),
            cubsOpponent: cubsGame?.opponent ?? null,
          };
        });

        if (!cancelled) {
          setForecast(combinedDays);
        }
      } catch (error) {
        if (!cancelled) {
          setForecast([]);
          setWeatherError(
            error instanceof Error
              ? error.message
              : "Unable to load weather data."
          );
        }
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [city, selectedDate]);

  const currentWeather = forecast[0];

  const recommendations = useMemo(() => {
    if (!currentWeather) {
      return [];
    }

    const items = [];

    if (
      qualifiesForBaseball(
        currentWeather,
        city,
        baseballThreshold
      )
    ) {
      items.push(
        `⚾ Today is a great day to see the Cubs play the ${currentWeather.cubsOpponent}!`
      );
    }

    if (
      qualifiesForSoccer(
        currentWeather,
        soccerThreshold
      )
    ) {
      items.push(
        "⚽ Today is a great day to play Soccer!"
      );
    }

    customRules.forEach((rule) => {
      if (qualifiesForCustomRule(currentWeather, rule)) {
        items.push(`${rule.emoji} ${rule.text}`);
      }
    });

    return items;
  }, [
    currentWeather,
    city,
    baseballThreshold,
    soccerThreshold,
    customRules,
  ]);

  function addCustomRule(rule) {
    setCustomRules((existingRules) => [
      ...existingRules,
      rule,
    ]);
  }

  function deleteCustomRule(ruleId) {
    setCustomRules((existingRules) =>
      existingRules.filter((rule) => rule.id !== ruleId)
    );
  }

  return (
    <main className={`weather-app ${season}`}>
      <div className="weather-container">
        <header className="weather-header">
          <div className="current-date">
            {formattedDate}
          </div>

          <select
            className="city-selector"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          >
            {CITY_OPTIONS.map((cityOption) => (
              <option
                value={cityOption}
                key={cityOption}
              >
                {cityOption}
              </option>
            ))}
          </select>

          <div className="current-temperature">
            {weatherLoading
              ? "--°"
              : currentWeather
                ? `${currentWeather.temperature}°`
                : "--°"}
          </div>

          <div className="current-condition">
            {weatherLoading
              ? "Loading weather..."
              : currentWeather?.weather ?? "Weather unavailable"}
          </div>
        </header>

        <section className="recommendations">
          {weatherError ? (
            <p className="weather-error">
              {weatherError}
            </p>
          ) : weatherLoading ? (
            <p className="no-recommendations">
              Checking today's recommendations...
            </p>
          ) : recommendations.length === 0 ? (
            <p className="no-recommendations">
              No activity recommendations for today.
            </p>
          ) : (
            recommendations.map((recommendation, index) => (
              <p
                className="recommendation"
                key={`${recommendation}-${index}`}
              >
                {recommendation}
              </p>
            ))
          )}
        </section>

        {forecast.length > 0 && (
          <ForecastList
            forecast={forecast}
            city={city}
            baseballThreshold={baseballThreshold}
            soccerThreshold={soccerThreshold}
            customRules={customRules}
          />
        )}

        <TesterSettings
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          baseballThreshold={baseballThreshold}
          setBaseballThreshold={setBaseballThreshold}
          soccerThreshold={soccerThreshold}
          setSoccerThreshold={setSoccerThreshold}
          customRules={customRules}
          addCustomRule={addCustomRule}
          deleteCustomRule={deleteCustomRule}
        />

        <a
          className="weather-attribution"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Weather data by Open-Meteo
        </a>
      </div>
    </main>
  );
}

export default App;
