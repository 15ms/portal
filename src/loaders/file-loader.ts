import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import { ILoader } from '../loader';
import { IAsset } from '../markup';
import { getComment, getScheme } from '../utility';

const readFile = promisify(fs.readFile);

export interface IOptionsForFileLoader {
  prefix: string;
  source: string;
}

export default class FileLoader implements ILoader {
  options: IOptionsForFileLoader;

  checkOptions(unknown: any): IOptionsForFileLoader {
    const options: IOptionsForFileLoader = {
      prefix: '/',
      source: ''
    };
    if (unknown && typeof unknown === 'object') {
      const { prefix, source } = unknown;
      if (typeof prefix === 'string') {
        options.prefix = prefix;
      }
      if (typeof source === 'string') {
        options.source = source;
      }
    }
    if (options.prefix[0] !== '/') {
      options.prefix = '/' + options.prefix;
    }
    if (!options.source) {
      throw new Error('options.source required in FileLoader')
    }
    return options;
  }

  constructor(options: any) {
    this.options = this.checkOptions(options);
  }

  matchAsset(asset: IAsset): boolean {
    if (getScheme(asset.src)) { return false; }
    return true;
  }

  async tryProcess(asset: IAsset): Promise<void> {
    if (asset.inline) {
      // for inline mode
      if (asset.raw && !asset.src) {
        return;
      }
      const file = path.join(this.options.source, asset.src);
      await readFile(file, 'utf-8')
        .then((content) => {
          asset.raw = content;
        })
        .catch((error) => {
          console.error(error);
          asset.raw = getComment(asset.type, 'file system error');
        });
    } else {
      // for non-inline mode
      asset.src = path.join(this.options.prefix, asset.src);
    }
  }
}
