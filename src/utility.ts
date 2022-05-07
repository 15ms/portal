import mime from 'mime-types';

const UNSAFE_CHARS_REGEXP = /[<>/\u2028\u2029]/g;
const SAFE_CHARS: Record<string, string> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
};

/**
 * replace unsafe chars with safe unicode counterpart
 * 
 * https://github.com/yahoo/serialize-javascript
 */
export function sanitize(text: string): string {
  return text.replace(UNSAFE_CHARS_REGEXP, char => SAFE_CHARS[char]);
}

export function arrayify(o: any | any[]): any[] {
  if (!o) { return []; }
  return Array.isArray(o) ? o : [o];
}

export function getScheme(file: string): string {
  const regexp = /^([a-z][a-z0-9+-.]*)?:?\/\/.*$/;
  const matches = file.match(regexp);
  if (matches) {
    return matches[1] || 'https';
  }
  return '';
}

export function getContentType(file: string): string {
  return mime.lookup(file) || 'text/plain';
}

export function getComment(type: string, info?: string): string {
  const comment = info || '';
  switch (type) {
    case 'text/html': return `<!-- epii = ${comment} -->`;
    case 'text/css': return `/* epii = ${comment} */`;
    case 'application/javascript': return `// epii = ${comment}`;
    default: return comment;
  }
}