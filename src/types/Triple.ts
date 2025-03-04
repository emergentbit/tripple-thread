export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  graph?: string;
  _delete?: boolean;  // Flag for soft deletion
}

export interface GraphManagerOptions {
  dbPath?: string;
  enableBackup?: boolean;
  backupPath?: string;
  maxConnections?: number;
  backupConfig?: {
    interval?: number;
    maxBackups?: number;
  };
  backupInterval?: number;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// URI validation regex based on RFC 3986
const URI_REGEX = /^(?:(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/(?:[a-zA-Z0-9-._~%!$&'()*+,;=]+@)?(?:\[[\da-fA-F:.]+\]|[a-zA-Z\d-._~%]+)(?::\d+)?(?:\/[a-zA-Z\d-._~%!$&'()*+,;=:@]*)*(?:\?[a-zA-Z\d-._~%!$&'()*+,;=:@/?]*)?(?:#[a-zA-Z\d-._~%!$&'()*+,;=:@/?]*)?)|(?:urn:[a-zA-Z0-9][a-zA-Z0-9-]{0,31}:[a-zA-Z0-9()+,\-.:=@;$_!*'%/?#]+)|(?:file:\/\/\/[a-zA-Z\d-._~%!$&'()*+,;=:@/]+))$/;

// Literal validation regex - matches quoted strings with optional language tag or datatype
const LITERAL_REGEX = /^"[^"\\]*(?:\\.[^"\\]*)*"(?:@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*|\^\^<[^<>\s]+>)?$/;

export function isValidUri(uri: string): boolean {
  // Check if uri is a string
  if (typeof uri !== 'string') return false;

  // Check for leading or trailing whitespace
  if (uri !== uri.trim()) return false;

  // Check if it's a valid URI
  return URI_REGEX.test(uri);
}

export function isValidLiteral(literal: string): boolean {
  // Basic checks
  if (typeof literal !== 'string' || literal.length < 2) return false;

  // Must start and end with quotes
  if (!literal.startsWith('"')) return false;

  // Find the matching closing quote
  let endQuoteIndex = -1;
  let inEscape = false;
  for (let i = 1; i < literal.length; i++) {
    if (literal[i] === '\\') {
      inEscape = !inEscape;
    } else if (literal[i] === '"' && !inEscape) {
      endQuoteIndex = i;
      break;
    } else {
      inEscape = false;
    }
  }

  // Must have a matching closing quote
  if (endQuoteIndex === -1) return false;

  // If there's no content between the quotes, it's invalid
  if (endQuoteIndex === 1) return false;

  // Check for language tag or datatype
  const rest = literal.slice(endQuoteIndex + 1);
  if (rest) {
    // Language tag
    if (rest.startsWith('@')) {
      // Language tags must follow BCP 47 format:
      // - Start with a 2-3 letter language code
      // - Optionally followed by subtags separated by hyphens
      // - Each subtag must be 1-8 alphanumeric characters
      const langTag = rest.slice(1); // Remove @
      if (!langTag) return false;

      const subtags = langTag.split('-');
      // First subtag must be 2-3 letters
      if (!/^[a-zA-Z]{2,3}$/.test(subtags[0])) return false;

      // Remaining subtags must be 1-8 alphanumeric characters
      for (let i = 1; i < subtags.length; i++) {
        if (!/^[a-zA-Z0-9]{1,8}$/.test(subtags[i])) return false;
      }
      return true;
    }
    // Datatype
    if (rest.startsWith('^^')) {
      const datatype = rest.slice(2);
      return datatype.startsWith('<') && datatype.endsWith('>') && isValidUri(datatype.slice(1, -1));
    }
    // If there's content after the closing quote but it's not a language tag or datatype, it's invalid
    return false;
  }

  // Check for invalid characters in the literal value
  const literalValue = literal.slice(1, endQuoteIndex);
  // Check for unescaped quotes or invalid escape sequences
  let i = 0;
  while (i < literalValue.length) {
    if (literalValue[i] === '\\') {
      if (i + 1 >= literalValue.length) return false;
      // Valid escape sequences: \", \\, \n, \r, \t
      if (!'"\\\nrt'.includes(literalValue[i + 1])) return false;
      i += 2;
    } else if (literalValue[i] === '"') {
      return false;
    } else if (literalValue[i] === '@' || (literalValue[i] === '^' && i + 1 < literalValue.length && literalValue[i + 1] === '^')) {
      // @ and ^^ are not allowed inside the quotes
      return false;
    } else {
      i++;
    }
  }

  return true;
}

export function validateTriple(triple: Triple): void {
  if (!isValidUri(triple.subject)) {
    throw new ValidationError(`Invalid subject URI: ${triple.subject}`);
  }

  if (!isValidUri(triple.predicate)) {
    throw new ValidationError(`Invalid predicate URI: ${triple.predicate}`);
  }

  if (!isValidUri(triple.object) && !isValidLiteral(triple.object)) {
    throw new ValidationError(`Invalid object (must be URI or literal): ${triple.object}`);
  }
}