import { Document } from './document';
import defaultLoaders, { ILoader } from './loader';
import FileLoader from './loaders/file-loader';
import { renderToString } from './renderer';

export {
  ILoader,
  Document,
  defaultLoaders,
  FileLoader,
  renderToString
};
