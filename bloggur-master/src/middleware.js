import { createMiddleware } from 'provide-page';
import renderToString from './renderAppToString';
import defaultProps from './defaultProps';

const middleware = createMiddleware({
  renderToString,
  defaultProps,
  getStates: states => {
    const pageState = states.page;
    const themeState = states.theme;

    if (!themeState) {
      return states;
    }

    return {
      ...states,

      page: {
        ...pageState,

        jsFiles: [
          themeState.themeFiles.jsFile,
          ...(pageState.jsFiles || [])
        ],

        cssFiles: [
          themeState.themeFiles.cssFile,
          ...(pageState.cssFiles || [])
        ]
      }
    };
  }
});

export default middleware;
