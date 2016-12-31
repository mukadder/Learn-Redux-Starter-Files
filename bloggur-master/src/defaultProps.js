import * as providers from './providers/index';
import themesFiles from './themes/files';

const min = process.env.MIN_EXT || '';
const themeName = Object.keys(themesFiles).shift();
const themeFiles = themesFiles[themeName];

export default {
  providers: {
    ...providers,

    page: {
      ...providers.page,

      state: {
        documentTitle: 'Bloggur',
        metaDescription: 'A simple blog application built with `react-redux-provide`. Demonstrates truly universal rendering with replication and queries.',
        jsFiles: [`/dist/Bloggur${min}.js`]
      }
    },

    theme: {
      ...providers.theme,

      state: {
        themesFiles,
        themeFiles,
        themeName
      }
    }
  }
};
