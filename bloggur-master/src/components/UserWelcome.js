import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Form } from 'provide-page';

const UserWelcome = ({ classes, userId, userName, destroySession }) => {
  const logOut = () => destroySession();

  const UserLink = (
    <Link className={classes.UserLink} to={`/${userName}`}>
      {userName}
    </Link>
  );

  if (userName) {
    return (
      <div className={classes.UserWelcome}>
        <div className={classes.UserWelcomeMessage}>
          Welcome, {UserLink}!
        </div>

        <Form
          className={classes.LogOut}
          formId="logOut"
          onSubmit={logOut}
        >
          <button className={classes.LogOutButton} type="submit">
            Log out
          </button>
        </Form>
      </div>
    );
  } else {
    return (
      <div className={classes.UserWelcome}>
        <div className={classes.UserWelcomeMessage}>
          Welcome!
        </div>

        <Link className={classes.LogInLink} to="/login">
          Log in
        </Link>
      </div>
    );
  }
}

UserWelcome.propTypes = {
  classes: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  destroySession: PropTypes.func.isRequired
};

export default UserWelcome;
