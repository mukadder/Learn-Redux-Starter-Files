import classes from './light.css';

export default {
  classes
};

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    const reloadTheme = require('provide-theme').reloadTheme;

    module.hot.accept('./light.css', () => {
      reloadTheme('LightTheme', {
        classes: require('./light.css')
      });
    });
  }
}
