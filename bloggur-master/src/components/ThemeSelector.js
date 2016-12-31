import React, { PropTypes } from 'react';
import { Form } from 'provide-page';

const ThemeSelector = ({
  classes, formId, themeName, themesFiles, loadTheme
}) => {
  const loadNextTheme = (event, formData) => {
    const themeNames = Object.keys(themesFiles);
    const themeIndex = themeNames.indexOf(themeName);
    const nextThemeName = themeNames[themeIndex + 1] || themeNames[0];

    loadTheme(nextThemeName, themesFiles[nextThemeName]);
  };

  return (
    <Form
      formId={formId}
      className={classes.ThemeSelector}
      onSubmit={loadNextTheme}
    >
      <button className={classes.ThemeName} type="submit">
        {themeName}
      </button>
    </Form>
  );
}

ThemeSelector.propTypes = {
  classes: PropTypes.object.isRequired,
  themesFiles: PropTypes.object.isRequired,
  themeName: PropTypes.string.isRequired,
  loadTheme: PropTypes.func.isRequired,
  formId: PropTypes.string
};

ThemeSelector.defaultProps = {
  formId: 'ThemeSelector'
};

export default ThemeSelector;
