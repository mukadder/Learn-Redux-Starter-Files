import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import UserWelcome from './UserWelcome';
import ThemeSelector from './ThemeSelector';

const Header = ({ classes, requestSession }) => (
  <div className={classes.Header}>
    <Link className={classes.HomeIcon} to="/" />
    <UserWelcome userId={requestSession.userId} />
    <ThemeSelector/>
  </div>
);

Header.propTypes = {
  classes: PropTypes.object.isRequired,
  requestSession: PropTypes.object.isRequired
};

export default Header;
