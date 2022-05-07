import defaultLoaders, { ILoader } from './loader';
import {
  buildAsset, buildInjectMarkup, buildMetaMarkup, buildHtmlMarkup,
  IAsset, IMarkupHtml, IMarkupIcon, IMarkupMeta, IMarkupScript, IMarkupStyle
} from './markup';
import { arrayify } from './utility';

export interface IDocument {
  name: string;
  html?: IMarkupHtml;
  head?: {
    metas: IMarkupMeta[];
    styles: IMarkupStyle[];
    scripts: IMarkupScript[];
    title: string;
    icons: IMarkupIcon[];
  }
  body?: {
    content: IMarkupHtml;
    inject?: IMarkupScript;
    scripts: IMarkupScript[];
  }
}

function buildDocument(unknown: any): IDocument {
  const result: IDocument = { name: '' };
  if (unknown && typeof unknown === 'object') {
    const { html, head, body } = unknown;
    if (html) {
      result.html = buildHtmlMarkup(html);
    }
    if (head && typeof head === 'object') {
      result.head = {
        metas: arrayify(head.metas).filter(Boolean).map(buildMetaMarkup),
        styles: arrayify(head.styles).filter(Boolean).map(buildAsset) as IMarkupStyle[],
        scripts: arrayify(head.scripts).filter(Boolean).map(buildAsset) as IMarkupScript[],
        title: head.title || '',
        icons: arrayify(head.icons).filter(Boolean).map(buildAsset) as IMarkupIcon[]
      };
    }
    if (body && typeof body === 'object') {
      result.body = {
        content: buildHtmlMarkup(body.content),
        scripts: arrayify(body.scripts).filter(Boolean).map(buildAsset) as IMarkupScript[]
      };
    }
  }
  return result;
}

export class Document {
  document: IDocument;

  allAssets(): IAsset[] {
    const { html, head, body } = this.document;
    if (html) {
      return [html];
    }
    const assets: IAsset[] = [];
    if (head) {
      assets.push(...head.styles);
      assets.push(...head.scripts);
      assets.push(...head.icons);
    }
    if (body) {
      assets.push(...body.scripts);
      assets.push(body.content);
    }
    return assets;
  }

  constructor(unknown: any) {
    this.document = buildDocument(unknown);
  }

  async applyLoaders(loaders: ILoader[] = []): Promise<void> {
    const assets = this.allAssets();
    const tasks = [];
    for (let asset of assets) {
      if (asset.loaded) { continue; }
      const matches = loaders.filter(loader => loader.matchAsset(asset));
      const task = matches.length === 0
        ? defaultLoaders.nullLoader.tryProcess(asset)
        : matches
          .reduce((p, loader) => p.then(() => loader.tryProcess(asset)), Promise.resolve())
          .then(() => {
            asset.loaded = true;
          });
      tasks.push(task);
    }
    await Promise.all(tasks);
  }

  getInjectCopy(inject: any): IDocument {
    const { name, html, head, body } = this.document;
    const clone: IDocument = { name };
    const copy = <T>(o: T) => ({ ...o });
    if (html) {
      clone.html = copy(html);
    }
    if (head && body) {
      clone.head = {
        metas: head.metas.map(copy),
        styles: head.styles.map(copy),
        scripts: head.scripts.map(copy),
        title: head.title,
        icons: head.icons.map(copy)
      };
      clone.body = {
        content: copy(body.content),
        inject: buildInjectMarkup(inject),
        scripts: body.scripts.map(copy)
      };
    };
    return clone;
  }
}