import React, { PropTypes } from 'react';
import { Form } from 'provide-page';

const UserLogIn = ({
  classes,
  formId,
  formData,
  genUserId,
  createUser,
  authenticateUser,
  userError,
  updateSession,
  requestSession,
  replaceRoute
}) => {
  const logIn = (event, formData) => {
    const updateUserSession = ({ userId, userName }) => {
      updateSession({ userId, userName });
      replaceRoute(`/${userName}`);
    };

    if (isSigningUp(formData)) {
      createUser(formData, genUserId, updateUserSession);
    } else {
      authenticateUser(formData, updateUserSession);
    }
  };

  const isSigningUp = ({ which, signUp }) => (
    which === 'signUp' || !which && typeof signUp !== 'undefined'
    // client             // server
  );

  const setWhich = (event) => {
    event.target.form.elements.which.value = event.target.name;
  };

  return (
    <Form
      className={classes.UserLogIn}
      formId={formId}
      serverSide={true}
      onSubmit={logIn}
    >
      <div className={classes.UserNameInputWrapper}>
        <input
          className={classes.UserNameInput}
          type="text"
          name="userName"
          placeholder="Name"
          defaultValue={formData && formData.userName}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.stopPropagation();
              event.preventDefault();
              event.target.form.elements.userPassword.focus();
            }
          }}
        />
      </div>

      <div className={classes.UserPasswordInputWrapper}>
        <input
          className={classes.UserPasswordInput}
          type="password"
          name="userPassword"
          placeholder="Password"
          defaultValue={formData && formData.userPassword}
        />
      </div>

      <div className={classes.LogInOrSignUp}>
        <button
          className={classes.LogInButton}
          type="submit"
          name="logIn"
          onClick={setWhich}
        >
          Log in
        </button>

        <button
          className={classes.SignUpButton}
          type="submit"
          name="signUp"
          onClick={setWhich}
        >
          Sign up
        </button>

        <input type="hidden" name="which" />
      </div>

      <div className={classes.UserError}>
        {userError}
      </div>
    </Form>
  );
}

UserLogIn.propTypes = {
  classes: PropTypes.object.isRequired,
  formId: PropTypes.string,
  formData: PropTypes.object,
  genUserId: PropTypes.func.isRequired,
  createUser: PropTypes.func.isRequired,
  authenticateUser: PropTypes.func.isRequired,
  userError: PropTypes.string.isRequired,
  updateSession: PropTypes.func.isRequired,
  requestSession: PropTypes.object.isRequired,
  replaceRoute: PropTypes.func.isRequired
};

UserLogIn.defaultProps = {
  formId: 'UserLogIn'
};

export default UserLogIn;
