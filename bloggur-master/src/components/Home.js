import React, { PropTypes } from 'react';
import LatestEntryList from './LatestEntryList';

const Home = ({ classes }) => (
  <div className={classes.Home}>
    <LatestEntryList />
  </div>
);

Home.propTypes = {
  classes: PropTypes.object.isRequired
};

export default Home;
