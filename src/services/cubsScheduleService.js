// cubsScheduleService.js
// Reads the Cubs schedule CSV from src/public.
//
// Expected CSV layout:
// - Column 1: game date
// - Column 4: matchup text such as "Brewers at Cubs"
//
// Only rows whose column 4 ends with "at Cubs" count as Cubs
// home games. The text before "at Cubs" becomes the opponent name.
//
// The CSV filename does NOT need to be hard-coded. Vite finds CSV
// files in src/public and this service prefers a filename containing
// "cub" if more than one CSV exists.

const csvFiles = import.meta.glob("../public/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});

let cachedGames = null;

// getCubsHomeGame
// dateKey: YYYY-MM-DD
//
// Returns:
// { dateKey, opponent }
// or null when the Cubs do not have a home game that day.
export function getCubsHomeGame(dateKey) {
  if (!cachedGames) {
    cachedGames = loadCubsHomeGames();
  }

  return cachedGames.get(dateKey) ?? null;
}

function loadCubsHomeGames() {
  const csvEntry = chooseScheduleCsv();

  if (!csvEntry) {
    console.warn(
      "No Cubs schedule CSV was found in src/public."
    );

    return new Map();
  }

  const [filePath, csvText] = csvEntry;
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    return new Map();
  }

  const scheduleYear = determineScheduleYear(
    filePath,
    rows
  );

  const games = new Map();

  rows.forEach((row) => {
    if (row.length < 4) {
      return;
    }

    const rawDate = row[0]?.trim();
    const rawMatchup = row[3]?.trim();

    if (!rawDate || !rawMatchup) {
      return;
    }

    // Example:
    // "Brewers at Cubs"
    // -> opponent = "Brewers"
    //
    // Away games such as "Cubs at Brewers" do not match.
    const homeGameMatch = rawMatchup.match(
      /^(.+?)\s+at\s+Cubs\s*$/i
    );

    if (!homeGameMatch) {
      return;
    }

    const opponent = homeGameMatch[1].trim();

    if (!opponent) {
      return;
    }

    const dateKey = normalizeScheduleDate(
      rawDate,
      scheduleYear
    );

    if (!dateKey) {
      return;
    }

    games.set(dateKey, {
      dateKey,
      opponent,
    });
  });

  return games;
}

function chooseScheduleCsv() {
  const entries = Object.entries(csvFiles);

  if (entries.length === 0) {
    return null;
  }

  // Prefer a file with "cub" in its filename/path.
  return (
    entries.find(([path]) =>
      path.toLowerCase().includes("cub")
    ) ?? entries[0]
  );
}

// Finds the season year from either:
// 1. The CSV filename/path
// 2. An explicit year in the first column
// 3. The current year as a fallback
function determineScheduleYear(filePath, rows) {
  const fileYear = filePath.match(/\b(20\d{2})\b/);

  if (fileYear) {
    return Number(fileYear[1]);
  }

  for (const row of rows) {
    const dateValue = row[0] ?? "";
    const yearMatch = dateValue.match(/\b(20\d{2})\b/);

    if (yearMatch) {
      return Number(yearMatch[1]);
    }
  }

  return new Date().getFullYear();
}

// Supports common schedule date formats, including:
// 2026-08-25
// 8/25/2026
// 8/25/26
// 8/25
// Tue, Aug 25
// Aug 25
function normalizeScheduleDate(rawDate, scheduleYear) {
  let value = rawDate
    .replace(/^\uFEFF/, "")
    .trim();

  if (!value) {
    return null;
  }

  const isoMatch = value.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (isoMatch) {
    return makeDateKey(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3])
    );
  }

  const slashMatch = value.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/
  );

  if (slashMatch) {
    let year = slashMatch[3]
      ? Number(slashMatch[3])
      : scheduleYear;

    if (year < 100) {
      year += 2000;
    }

    return makeDateKey(
      year,
      Number(slashMatch[1]),
      Number(slashMatch[2])
    );
  }

  // Remove a leading weekday such as "Tue, ".
  value = value.replace(
    /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+/i,
    ""
  );

  if (!/\b20\d{2}\b/.test(value)) {
    value = `${value} ${scheduleYear}`;
  }

  // Parsing at noon avoids timezone boundary issues.
  const parsed = new Date(`${value} 12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return makeDateKey(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
    parsed.getDate()
  );
}

// Small CSV parser that supports:
// - quoted values
// - commas inside quoted values
// - escaped double-quotes
function parseCsv(text) {
  const rows = [];

  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !inQuotes
    ) {
      // Treat CRLF as one line ending.
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      row.push(cell);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);

  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function makeDateKey(year, month, day) {
  const date = new Date(year, month - 1, day);

  // Reject invalid dates such as February 31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}
