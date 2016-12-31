import React, { PropTypes } from 'react';

const NotFound = ({ classes, setStatusCode, setDocumentTitle }) => {
  setStatusCode(404);
  setDocumentTitle('404 - Not found!');

  return (
    <div className={classes.NotFound}>
      <h1>404</h1>
      <h3>Not found!</h3>
    </div>
  );
}

NotFound.propTypes = {
  classes: PropTypes.object.isRequired,
  setStatusCode: PropTypes.func.isRequired,
  setDocumentTitle: PropTypes.func.isRequired
};

export default NotFound;
