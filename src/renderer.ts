import { IDocument } from './document';
import { IMarkupIcon, IMarkupMeta, IMarkupScript, IMarkupStyle } from './markup';

function renderIcon(markup: IMarkupIcon) {
  return `<link rel="icon" type="${markup.type}" href="${markup.src}" />`;
}

function renderMeta(markup: IMarkupMeta): string {
  // never render http-equiv
  if (markup.name) {
    return `<meta name="${markup.name}" content="${markup.content || ''}" />`;
  }
  return '';
}

function renderStyle(markup: IMarkupStyle): string {
  if (markup.raw) {
    return `<style>\n${markup.raw}\n</style>`;
  }
  return `<link rel="stylesheet" href="${markup.src}" />`;
}

function renderScript(markup: IMarkupScript): string {
  if (markup.raw) {
    return `<script>\n${markup.raw}\n</script>`;
  }
  return `<script type="${markup.type}" src="${markup.src}"></script>`;
}

export function renderToString(document: IDocument): string {
  const { html, head, body } = document;
  if (html) {
    return html.raw;
  }
  if (head && body) {
    const lines = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<meta charset="utf8" />'
    ]
      .concat(head.metas.map(renderMeta))
      .concat(head.styles.map(renderStyle))
      .concat(head.scripts.map(renderScript))
      .concat(`<title>${head.title || ''}</title>`)
      .concat(head.icons.map(renderIcon))
      .concat('</head>', '<body>')
      .concat(body.content.raw || '')
      .concat(body.inject ? renderScript(body.inject) : '')
      .concat(body.scripts.map(renderScript))
      .concat('</body>', '</html>');
    return lines.filter(Boolean).join('\n')
  }
  return '';
}
