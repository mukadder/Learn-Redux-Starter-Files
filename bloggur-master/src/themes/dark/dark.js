import classes from './dark.css';

export default {
  classes
};

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    const reloadTheme = require('provide-theme').reloadTheme;

    module.hot.accept('./dark.css', () => {
      reloadTheme('DarkTheme', {
        classes: require('./dark.css')
      });
    });
  }
}
