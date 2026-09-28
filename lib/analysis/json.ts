export function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Model returned empty content.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Model output did not contain a JSON object.");
    }

    return JSON.parse(match[0]);
  }
}
