import { getContentType, sanitize } from './utility';

export interface IAsset {
  loaded: boolean;
  inline: boolean;
  type: string;
  src: string;
  raw: string;
}

/**
 * http-equiv should not be used
 */
export interface IMarkupMeta {
  name: string;
  content: string;
}

export interface IMarkupHtml extends IAsset {
  inline: true;
}

export interface IMarkupIcon extends IAsset {}

export interface IMarkupStyle extends IAsset {}

export interface IMarkupScript extends IAsset {
  type: 'application/javascript',
  async?: boolean;
}

export function buildAsset(unknown: any): IAsset {
  const asset: IAsset = {
    loaded: false,
    inline: false,
    type: '',
    src: '',
    raw: ''
  };
  if (typeof unknown === 'string') {
    asset.src = unknown;
  }
  if (typeof unknown === 'object' && unknown) {
    if (typeof unknown.loaded === 'boolean') {
      asset.loaded = unknown.loaded;
    }
    if (typeof unknown.inline === 'boolean') {
      asset.inline = unknown.inline;
    }
    asset.type = unknown.type || '';
    asset.src = unknown.src || '';
    asset.raw = unknown.raw || '';
  }
  asset.type = getContentType(asset.src);
  return asset;
}

export function buildMetaMarkup(unknown: any): IMarkupMeta {
  if (!unknown) {
    throw new Error('only accept non-null object');
  }
  const { name, content } = unknown;
  return { name, content };
}

export function buildHtmlMarkup(unknown: any): IMarkupHtml {
  const asset = buildAsset(unknown);
  asset.inline = true;
  asset.type = 'text/html';
  return asset as IMarkupHtml;
}

export function buildInjectMarkup(inject: any): IMarkupScript {
  let state = 'undefined';
  if (inject) {
    if (typeof inject === 'function') {
      console.error('inject should not be function');
    } else {
      state = sanitize(JSON.stringify(inject));
    }
  }
  const script = `if(!window.epii)window.epii={};window.epii.state=${state};`;
  return {
    loaded: true,
    inline: true,
    type: 'application/javascript',
    src: '',
    raw: script
  };
}