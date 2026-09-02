// TesterSettings.jsx
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
  updateCustomRule,
  deleteCustomRule,
}) {
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);

  const [ruleText, setRuleText] = useState("");
  const [ruleEmoji, setRuleEmoji] = useState("⭐");
  const [minimumTemperature, setMinimumTemperature] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [weather, setWeather] = useState("Any");

  const weekdayOptions = DAYS_OF_WEEK.filter(
    (day) => day !== "Any"
  );

  function resetForm() {
    setEditingRuleId(null);
    setRuleText("");
    setRuleEmoji("⭐");
    setMinimumTemperature("");
    setDaysOfWeek([]);
    setWeather("Any");
  }

  function openAddRuleModal() {
    resetForm();
    setShowRuleModal(true);
  }

  function openEditRuleModal(rule) {
    setEditingRuleId(rule.id);
    setRuleText(rule.text);
    setRuleEmoji(rule.emoji || "⭐");
    setMinimumTemperature(rule.minimumTemperature ?? "");

    if (Array.isArray(rule.daysOfWeek)) {
      setDaysOfWeek(rule.daysOfWeek);
    } else if (rule.dayOfWeek && rule.dayOfWeek !== "Any") {
      setDaysOfWeek([rule.dayOfWeek]);
    } else {
      setDaysOfWeek([]);
    }

    setWeather(rule.weather ?? "Any");
    setShowRuleModal(true);
  }

  function closeRuleModal() {
    setShowRuleModal(false);
    resetForm();
  }

  function toggleDay(day) {
    setDaysOfWeek((selectedDays) => {
      if (selectedDays.includes(day)) {
        return selectedDays.filter(
          (selectedDay) => selectedDay !== day
        );
      }

      return [...selectedDays, day];
    });
  }

  function handleSaveRule() {
    if (!ruleText.trim()) {
      return;
    }

    const rule = {
      id: editingRuleId ?? crypto.randomUUID(),
      text: ruleText.trim(),
      emoji: ruleEmoji || "⭐",
      minimumTemperature,
      daysOfWeek,
      weather,
    };

    if (editingRuleId) {
      updateCustomRule(rule);
    } else {
      addCustomRule(rule);
    }

    closeRuleModal();
  }

  function handleDateChange(event) {
    const date = parseDateInput(event.target.value);

    if (date) {
      setSelectedDate(date);
    }
  }

  function formatRuleDays(rule) {
    let selectedDays = [];

    if (Array.isArray(rule.daysOfWeek)) {
      selectedDays = rule.daysOfWeek;
    } else if (rule.dayOfWeek && rule.dayOfWeek !== "Any") {
      selectedDays = [rule.dayOfWeek];
    }

    if (selectedDays.length === 0) {
      return "Any day";
    }

    if (selectedDays.length === 7) {
      return "Every day";
    }

    return selectedDays
      .map((day) => day.slice(0, 3))
      .join(", ");
  }

  function formatRuleRequirements(rule) {
    const requirements = [];

    if (rule.minimumTemperature) {
      requirements.push(`>${rule.minimumTemperature}°`);
    }

    requirements.push(formatRuleDays(rule));

    if (rule.weather && rule.weather !== "Any") {
      requirements.push(rule.weather);
    }

    return requirements.join(" • ");
  }

  return (
    <>
      <section className="tester-settings">
        <div className="tester-header">
          <h2>TESTER SETTINGS</h2>

          <button
            className="add-rule-button"
            onClick={openAddRuleModal}
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
              <div className="settings-rule" key={rule.id}>
                <div className="settings-rule-text">
                  <span>
                    {rule.emoji} {rule.text}
                  </span>

                  <span>
                    {formatRuleRequirements(rule)}
                  </span>
                </div>

                <div className="rule-action-buttons">
                  <button
                    className="edit-rule-button"
                    onClick={() => openEditRuleModal(rule)}
                    aria-label={`Edit ${rule.text}`}
                    title="Edit custom rule"
                  >
                    ✎
                  </button>

                  <button
                    className="delete-rule-button"
                    onClick={() => deleteCustomRule(rule.id)}
                    aria-label={`Delete ${rule.text}`}
                    title="Delete custom rule"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showRuleModal && (
        <div className="modal-backdrop">
          <div className="rule-modal">
            <div className="modal-header">
              <h2>
                {editingRuleId
                  ? "Edit Recommendation"
                  : "Add Recommendation"}
              </h2>

              <button
                className="close-button"
                onClick={closeRuleModal}
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

            <fieldset className="day-checkbox-fieldset">
              <legend>Days of Week</legend>

              <p className="day-checkbox-help">
                Leave all unchecked to allow any day.
              </p>

              <div className="day-checkbox-list">
                {weekdayOptions.map((day) => (
                  <label
                    className="day-checkbox-option"
                    key={day}
                  >
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(day)}
                      onChange={() => toggleDay(day)}
                    />

                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </fieldset>

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
                onClick={closeRuleModal}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={handleSaveRule}
              >
                {editingRuleId
                  ? "Save Changes"
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TesterSettings;
