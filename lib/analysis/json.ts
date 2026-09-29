export function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Model returned empty content.");
  }

  try {
    return JSON.parse(trimmed);
  } catch (initialError) {
    const match = trimmed.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Model output did not contain a JSON object.");
    }

    const extractedJson = match[0];

    try {
      return JSON.parse(extractedJson);
    } catch {
      try {
        return JSON.parse(repairCommonJsonIssues(extractedJson));
      } catch {
        throw initialError;
      }
    }
  }
}

function repairCommonJsonIssues(value: string): string {
  return value
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/"\s*\n\s*"/g, '",\n"')
    .replace(/]\s*\n\s*"/g, '],\n"')
    .replace(/}\s*\n\s*"/g, '},\n"');
}
