import {
  qualifiesForBaseball,
  qualifiesForSoccer,
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

          const matchingCustomRules = customRules.filter((rule) =>
            qualifiesForCustomRule(day, rule)
          );

          const hasRecommendations =
            baseball ||
            soccer ||
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
                {baseball && <span title="Cubs game">⚾</span>}

                {soccer && <span title="Soccer">⚽</span>}

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
