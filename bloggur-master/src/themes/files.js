const min = process.env.MIN_EXT || '';

export default {
  DarkTheme: {
    jsFile: `/dist/DarkTheme${min}.js`,
    cssFile: `/dist/DarkTheme${min}.css`
  },
  LightTheme: {
    jsFile: `/dist/LightTheme${min}.js`,
    cssFile: `/dist/LightTheme${min}.css`
  }
};
