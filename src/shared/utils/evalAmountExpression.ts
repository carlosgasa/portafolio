/** Evalua un monto escrito como numero plano ("726") o como formula al
 * estilo hoja de calculo ("=635+876-88"). No usa eval/Function: es un
 * parser recursivo propio que solo entiende +, -, *, /, parentesis y
 * decimales. Regresa null si no se puede interpretar. */

type Token = { type: "num"; value: number } | { type: "op"; value: "+" | "-" | "*" | "/" } | { type: "lparen" } | { type: "rparen" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      const numStr = expr.slice(i, j);
      const value = Number(numStr);
      if (Number.isNaN(value)) return [];
      tokens.push({ type: "num", value });
      i = j;
      continue;
    }
    return []; // caracter no soportado -> expresion invalida
  }
  return tokens;
}

function parseTokens(tokens: Token[]): number | null {
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseFactor(): number | null {
    const t = peek();
    if (!t) return null;
    if (t.type === "num") {
      consume();
      return t.value;
    }
    if (t.type === "lparen") {
      consume();
      const v = parseExpr();
      const close = consume();
      if (v === null || !close || close.type !== "rparen") return null;
      return v;
    }
    if (t.type === "op" && t.value === "-") {
      consume();
      const v = parseFactor();
      return v === null ? null : -v;
    }
    if (t.type === "op" && t.value === "+") {
      consume();
      return parseFactor();
    }
    return null;
  }

  function isOp(t: Token | undefined, ...ops: string[]): t is { type: "op"; value: "+" | "-" | "*" | "/" } {
    return !!t && t.type === "op" && ops.includes(t.value);
  }

  function parseTerm(): number | null {
    let v = parseFactor();
    if (v === null) return null;
    while (isOp(peek(), "*", "/")) {
      const op = consume() as { type: "op"; value: "*" | "/" };
      const rhs = parseFactor();
      if (rhs === null) return null;
      v = op.value === "*" ? v * rhs : v / rhs;
    }
    return v;
  }

  function parseExpr(): number | null {
    let v = parseTerm();
    if (v === null) return null;
    while (isOp(peek(), "+", "-")) {
      const op = consume() as { type: "op"; value: "+" | "-" };
      const rhs = parseTerm();
      if (rhs === null) return null;
      v = op.value === "+" ? v + rhs : v - rhs;
    }
    return v;
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length) return null;
  return result;
}

export function evalAmountExpression(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("=")) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  const tokens = tokenize(trimmed.slice(1));
  if (tokens.length === 0) return null;
  const result = parseTokens(tokens);
  return result !== null && Number.isFinite(result) ? result : null;
}
