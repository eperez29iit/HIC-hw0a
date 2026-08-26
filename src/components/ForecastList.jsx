// ForecastList.jsx
// Displays the seven-day forecast and recommendation emojis.

import {
  qualifiesForBaseball,
  qualifiesForSoccer,
  qualifiesForUmbrella,
  qualifiesForCustomRule,
} from "../utils/weatherUtils";

function ForecastList({
  forecast,
  city,
  baseballThreshold,
  soccerThreshold,
  customRules,
}) {
  return (
    <section className="forecast-section">
      <h2>Next 7 Days</h2>

      <div className="forecast-list">
        {forecast.map((day) => {
          const baseball =
            qualifiesForBaseball(day, city, baseballThreshold);

          const soccer =
            qualifiesForSoccer(day, soccerThreshold);

          const umbrella =
            qualifiesForUmbrella(day);

          const matchingCustomRules = customRules.filter((rule) =>
            qualifiesForCustomRule(day, rule)
          );

          const hasRecommendations =
            baseball ||
            soccer ||
            umbrella ||
            matchingCustomRules.length > 0;

          return (
            <div
              className="forecast-row"
              key={day.date.toISOString()}
            >
              <div className="forecast-main-row">
                <div className="forecast-day">
                  {day.dayName}
                </div>

                <div className="forecast-weather">
                  <span>{day.weather}</span>
                  <span>{day.temperature}°</span>
                </div>
              </div>

              <div
                className={`forecast-emojis ${
                  hasRecommendations ? "" : "empty"
                }`}
              >
                {baseball && (
                  <span title="Cubs home game">⚾</span>
                )}

                {soccer && (
                  <span title="Good day for soccer">⚽</span>
                )}

                {umbrella && (
                  <span title="Bring an umbrella">☔</span>
                )}

                {matchingCustomRules.map((rule) => (
                  <span
                    key={rule.id}
                    title={rule.text}
                  >
                    {rule.emoji}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ForecastList;
