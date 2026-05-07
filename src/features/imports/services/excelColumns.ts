export function toExcelColumnLetter(index: number): string {
  let number = index + 1;
  let letters = "";

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    number = Math.floor((number - 1) / 26);
  }

  return letters;
}

export function formatColumnRef(index: number, rawHeader: string): string {
  const letter = toExcelColumnLetter(index);
  const columnNumber = index + 1;
  const header = rawHeader.trim() || "başlık boş";

  return `Kolon ${letter} (${columnNumber}): '${header}'`;
}
