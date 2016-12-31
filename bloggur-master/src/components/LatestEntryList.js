import React, { PropTypes } from 'react';
import EntryLink from './EntryLink';
import { Link } from 'react-router';

const LatestEntryList = ({
  classes,
  query,
  queryOptions,
  result
}) => (
  <div className={classes.LatestEntryList}>
    <h3 className={classes.LatestEntryListHeader}>
      Latest entries
    </h3>

    {result && result.length
      ? result.map(entryState => (
        <EntryLink
          { ...entryState }
          userId={entryState.entryByUserId}
          key={`entryId=${entryState.entryId}`}
          selected={false}
        />
      ))
      : (
        <div className={classes.NothingYet}>
          Nothing yet!
        </div>
      )
    }

    <Link className={classes.CreateLink} to="/create">
      Create blog entry
    </Link>
  </div>
);

LatestEntryList.propTypes = {
  classes: PropTypes.object.isRequired,
  query: PropTypes.any,
  queryOptions: PropTypes.object.isRequired,
  result: PropTypes.any
};

LatestEntryList.defaultProps = {
  query: { entryDeleted: false },
  queryOptions: {
    limit: 10,
    select: [
      'entryByUserId',
      'entryId',
      'entryName',
      'entrySlug'
    ]
  }
};

export default LatestEntryList;
