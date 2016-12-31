import theme from 'provide-theme';

function getThemeKey(pageState) {
  const { userId } = pageState.requestSession;

  return userId ? `theme&userId=${userId}` : null;
}

theme.replication.key = null;

theme.subscribeTo = {
  page({ store: pageStore }, { store: themeStore }) {
    if (themeStore.setKey) {
      const themeKey = getThemeKey(pageStore.getState());

      if (themeKey !== themeStore.key) {
        themeStore.setKey(themeKey);
      }
    }
  }
};

export default theme;
