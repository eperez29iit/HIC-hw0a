// TesterSettings.jsx
// Development/testing controls for dates, thresholds,
// built-in recommendation rules, and custom rules.

import { useState } from "react";

import {
  DAYS_OF_WEEK,
  WEATHER_TYPES,
  formatDateForInput,
  parseDateInput,
} from "../utils/weatherUtils";

function TesterSettings({
  selectedDate,
  setSelectedDate,
  baseballThreshold,
  setBaseballThreshold,
  soccerThreshold,
  setSoccerThreshold,
  customRules,
  addCustomRule,
  deleteCustomRule,
}) {
  const [showRuleModal, setShowRuleModal] = useState(false);

  const [ruleText, setRuleText] = useState("");
  const [ruleEmoji, setRuleEmoji] = useState("⭐");
  const [minimumTemperature, setMinimumTemperature] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Any");
  const [weather, setWeather] = useState("Any");

  function resetForm() {
    setRuleText("");
    setRuleEmoji("⭐");
    setMinimumTemperature("");
    setDayOfWeek("Any");
    setWeather("Any");
  }

  function handleAddRule() {
    if (!ruleText.trim()) {
      return;
    }

    addCustomRule({
      id: crypto.randomUUID(),
      text: ruleText.trim(),
      emoji: ruleEmoji || "⭐",
      minimumTemperature,
      dayOfWeek,
      weather,
    });

    resetForm();
    setShowRuleModal(false);
  }

  function handleDateChange(event) {
    const date = parseDateInput(event.target.value);

    if (date) {
      setSelectedDate(date);
    }
  }

  return (
    <>
      <section className="tester-settings">
        <div className="tester-header">
          <h2>TESTER SETTINGS</h2>

          <button
            className="add-rule-button"
            onClick={() => setShowRuleModal(true)}
            aria-label="Add recommendation rule"
          >
            +
          </button>
        </div>

        <div className="settings-grid">
          <label>
            Test Date

            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={handleDateChange}
            />
          </label>

          <label>
            Baseball Temperature

            <div className="temperature-input">
              <input
                type="number"
                value={baseballThreshold}
                onChange={(event) =>
                  setBaseballThreshold(Number(event.target.value))
                }
              />
              <span>°F</span>
            </div>
          </label>

          <label>
            Soccer Temperature

            <div className="temperature-input">
              <input
                type="number"
                value={soccerThreshold}
                onChange={(event) =>
                  setSoccerThreshold(Number(event.target.value))
                }
              />
              <span>°F</span>
            </div>
          </label>
        </div>

        <div className="default-rules">
          <h3>Default Rules</h3>

          <div className="settings-rule">
            <div className="settings-rule-text">
              <span>⚾ Cubs</span>
              <span>
                Over {baseballThreshold}° + Cubs home game
              </span>
            </div>
          </div>

          <div className="settings-rule">
            <div className="settings-rule-text">
              <span>⚽ Soccer</span>
              <span>
                Over {soccerThreshold}° + Sunny
              </span>
            </div>
          </div>

          <div className="settings-rule">
            <div className="settings-rule-text">
              <span>☔ Umbrella</span>
              <span>
                Rainy or any chance of rain
              </span>
            </div>
          </div>
        </div>

        {customRules.length > 0 && (
          <div className="custom-rules">
            <h3>Custom Rules</h3>

            {customRules.map((rule) => (
              <div
                className="settings-rule"
                key={rule.id}
              >
                <div className="settings-rule-text">
                  <span>
                    {rule.emoji} {rule.text}
                  </span>

                  <span>
                    {rule.minimumTemperature
                      ? `>${rule.minimumTemperature}° `
                      : ""}

                    {rule.dayOfWeek !== "Any"
                      ? `${rule.dayOfWeek} `
                      : ""}

                    {rule.weather !== "Any"
                      ? rule.weather
                      : ""}
                  </span>
                </div>

                <button
                  className="delete-rule-button"
                  onClick={() => deleteCustomRule(rule.id)}
                  aria-label={`Delete ${rule.text}`}
                  title="Delete custom rule"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {showRuleModal && (
        <div className="modal-backdrop">
          <div className="rule-modal">
            <div className="modal-header">
              <h2>Add Recommendation</h2>

              <button
                className="close-button"
                onClick={() => setShowRuleModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label>
              Emoji

              <input
                type="text"
                maxLength="2"
                value={ruleEmoji}
                onChange={(event) =>
                  setRuleEmoji(event.target.value)
                }
              />
            </label>

            <label>
              Recommendation Text

              <input
                type="text"
                placeholder="Today is a great day to..."
                value={ruleText}
                onChange={(event) =>
                  setRuleText(event.target.value)
                }
              />
            </label>

            <label>
              Minimum Temperature

              <input
                type="number"
                placeholder="Optional"
                value={minimumTemperature}
                onChange={(event) =>
                  setMinimumTemperature(event.target.value)
                }
              />
            </label>

            <label>
              Day of Week

              <select
                value={dayOfWeek}
                onChange={(event) =>
                  setDayOfWeek(event.target.value)
                }
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Weather

              <select
                value={weather}
                onChange={(event) =>
                  setWeather(event.target.value)
                }
              >
                {WEATHER_TYPES.map((weatherType) => (
                  <option
                    key={weatherType}
                    value={weatherType}
                  >
                    {weatherType}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowRuleModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={handleAddRule}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TesterSettings;
