import React, { PropTypes } from 'react';
import Header from './Header';

const Bloggur = ({ classes, children }) => (
  <div className={classes.Bloggur}>
    <Header/>

    <div className={classes.Body}>
      {children}
    </div>
  </div>
);

Bloggur.propTypes = {
  classes: PropTypes.object.isRequired
};

export default Bloggur;
