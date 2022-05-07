import { IAsset } from './markup';
import NullLoader from './loaders/null-loader';

export interface ILoader {
  matchAsset: (asset: IAsset) => boolean;
  tryProcess: (asset: IAsset) => Promise<void>;
}

const DEFAULT_LOADERS = {
  nullLoader: new NullLoader()
};

export default DEFAULT_LOADERS;
