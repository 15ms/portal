import { ILoader } from '../loader';
import { IAsset } from '../markup';
import { getComment } from '../utility';

export default class NullLoader implements ILoader {
  constructor() {
  }

  matchAsset(asset: IAsset): boolean {
    return true;
  }

  async tryProcess(asset: IAsset): Promise<void> {
    if (asset.inline) {
      asset.raw = getComment(asset.type, 'loaders not found');
    }
  }
}
