export function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function toCsv(headers, rows) {
  const head = headers.map(escapeCsvField).join(",");
  const body = rows
    .map((row) => headers.map((key) => escapeCsvField(row[key])).join(","))
    .join("\n");
  return `${head}\n${body}\n`;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        i += 1;
        continue;
      }
      if (char === "\"") {
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      pushField();
      continue;
    }
    if (char === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (char === "\r") {
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...body] = rows;
  return body
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const out = {};
      headers.forEach((key, idx) => {
        out[key] = cells[idx] ?? "";
      });
      return out;
    });
}
