// Parses the `TLD`/`STP`/`STN`/`DTX` array-literal assignments out of loo-ool.com's
// third-party schedule script WITHOUT ever executing that script (no eval/new
// Function/vm). Only a fixed grammar of numbers, quoted strings, `[`, `]`, `,` is
// accepted — any identifier, function call, or operator throws instead of parsing.

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export type ParsedValue = number | string | ParsedValue[];

export interface ParsedSchedule {
  TLD: (number | string)[][];
  STP: number[];
  STN: string[];
  DTX: string[];
}

const ESCAPE_MAP: Record<string, string> = {
  '"': '"',
  "'": "'",
  '\\': '\\',
  n: '\n',
  t: '\t',
  '/': '/',
};

class ArrayLiteralParser {
  private pos = 0;

  constructor(private readonly text: string) {}

  private skipWhitespace(): void {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) {
      this.pos++;
    }
  }

  private peek(): string | undefined {
    this.skipWhitespace();
    return this.text[this.pos];
  }

  private readString(quote: string): string {
    this.pos++; // consume opening quote
    let result = '';
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch === '\\') {
        const next = this.text[this.pos + 1];
        if (next === undefined || !(next in ESCAPE_MAP)) {
          throw new ParseError(`Invalid escape sequence at position ${this.pos}`);
        }
        result += ESCAPE_MAP[next];
        this.pos += 2;
        continue;
      }
      if (ch === quote) {
        this.pos++;
        return result;
      }
      result += ch;
      this.pos++;
    }
    throw new ParseError('Unterminated string literal');
  }

  private readNumber(): number {
    const start = this.pos;
    if (this.text[this.pos] === '-') this.pos++;
    while (this.pos < this.text.length && /[0-9]/.test(this.text[this.pos])) this.pos++;
    if (this.text[this.pos] === '.') {
      this.pos++;
      while (this.pos < this.text.length && /[0-9]/.test(this.text[this.pos])) this.pos++;
    }
    const raw = this.text.slice(start, this.pos);
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      throw new ParseError(`Invalid number literal near position ${start}`);
    }
    return Number(raw);
  }

  private parseValue(): ParsedValue {
    const ch = this.peek();
    if (ch === undefined) throw new ParseError('Unexpected end of input while parsing a value');
    if (ch === '[') return this.parseArray();
    if (ch === '"' || ch === "'") {
      this.skipWhitespace();
      return this.readString(ch);
    }
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      this.skipWhitespace();
      return this.readNumber();
    }
    throw new ParseError(`Unexpected character "${ch}" at position ${this.pos}`);
  }

  private parseArray(): ParsedValue[] {
    this.skipWhitespace();
    if (this.text[this.pos] !== '[') throw new ParseError(`Expected "[" at position ${this.pos}`);
    this.pos++;
    const items: ParsedValue[] = [];
    this.skipWhitespace();
    if (this.text[this.pos] === ']') {
      this.pos++;
      return items;
    }
    for (;;) {
      items.push(this.parseValue());
      this.skipWhitespace();
      const next = this.text[this.pos];
      if (next === ',') {
        this.pos++;
        continue;
      }
      if (next === ']') {
        this.pos++;
        break;
      }
      throw new ParseError(`Expected "," or "]" at position ${this.pos}, got ${JSON.stringify(next)}`);
    }
    return items;
  }

  /** Top-level: a comma-separated list of values with no enclosing brackets. */
  parseTopLevelList(): ParsedValue[] {
    const items: ParsedValue[] = [];
    this.skipWhitespace();
    if (this.pos >= this.text.length) return items;
    for (;;) {
      items.push(this.parseValue());
      this.skipWhitespace();
      if (this.pos >= this.text.length) break;
      const next = this.text[this.pos];
      if (next === ',') {
        this.pos++;
        this.skipWhitespace();
        if (this.pos >= this.text.length) break; // tolerate a trailing comma
        continue;
      }
      throw new ParseError(`Expected "," or end of input at position ${this.pos}, got ${JSON.stringify(next)}`);
    }
    return items;
  }
}

export function parseArrayLiteralList(text: string): ParsedValue[] {
  return new ArrayLiteralParser(text).parseTopLevelList();
}

/**
 * Locates `varName = new Array(` in the raw script and returns the exact
 * substring between its matching parentheses, using a string-literal-aware
 * paren-depth scan (so a `)` or `,` inside a quoted Japanese string is never
 * miscounted as structural).
 */
function extractArrayLiteralSource(script: string, varName: string): string {
  const marker = new RegExp(`\\b${varName}\\s*=\\s*new\\s+Array\\s*\\(`);
  const match = marker.exec(script);
  if (!match) {
    throw new ParseError(`Could not locate "${varName} = new Array(" in script`);
  }

  const start = match.index + match[0].length; // just after the opening "("
  let depth = 1;
  let i = start;
  let inString: string | null = null;

  for (; i < script.length && depth > 0; i++) {
    const ch = script[i];
    if (inString) {
      if (ch === '\\') {
        i++; // skip the escaped character
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
  }

  if (depth !== 0) {
    throw new ParseError(`Unbalanced parentheses while extracting "${varName}"`);
  }

  return script.slice(start, i - 1);
}

function extractAndParse(script: string, varName: string): ParsedValue[] {
  return parseArrayLiteralList(extractArrayLiteralSource(script, varName));
}

/**
 * Safely extracts and parses TLD/STP/STN/DTX from loo-ool.com's raw schedule
 * script. Throws ParseError on any malformed, unexpected, or non-data content
 * (including anything that looks like injected code) rather than silently
 * producing garbage or executing it.
 */
export function parseLooOolSchedule(rawScript: string): ParsedSchedule {
  const tldRaw = extractAndParse(rawScript, 'TLD');
  const stpRaw = extractAndParse(rawScript, 'STP');
  const stnRaw = extractAndParse(rawScript, 'STN');
  const dtxRaw = extractAndParse(rawScript, 'DTX');

  const TLD = tldRaw.map((row, i) => {
    if (!Array.isArray(row)) throw new ParseError(`TLD row ${i} is not an array`);
    for (const cell of row) {
      if (typeof cell !== 'number' && typeof cell !== 'string') {
        throw new ParseError(`TLD row ${i} contains a nested array where a scalar was expected`);
      }
    }
    return row as (number | string)[];
  });

  const STP = stpRaw.map((v, i) => {
    if (typeof v !== 'number') throw new ParseError(`STP[${i}] is not a number`);
    return v;
  });

  const STN = stnRaw.map((v, i) => {
    if (typeof v !== 'string') throw new ParseError(`STN[${i}] is not a string`);
    return v;
  });

  const DTX = dtxRaw.map((v, i) => {
    if (typeof v !== 'string') throw new ParseError(`DTX[${i}] is not a string`);
    return v;
  });

  if (TLD.length === 0) throw new ParseError('TLD is empty');
  if (STP.length !== 16) throw new ParseError(`Expected STP to have 16 entries, got ${STP.length}`);
  if (STN.length !== 16) throw new ParseError(`Expected STN to have 16 entries, got ${STN.length}`);

  return { TLD, STP, STN, DTX };
}
