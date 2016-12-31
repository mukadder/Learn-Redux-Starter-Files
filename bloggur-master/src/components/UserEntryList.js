import React, { PropTypes } from 'react';
import EntryLink from './EntryLink';
import { Link } from 'react-router';

const UserEntryList = ({
  classes,
  setDocumentTitle,
  location,
  entryId,
  userId,
  userName,
  query,
  queryOptions,
  result
}) => {
  setDocumentTitle(`${userName}'s entries`);

  return (
    <div className={classes.UserEntryList}>
      <h3 className={classes.UserEntryListHeader}>
        {userName}'s entries
      </h3>

      {result && result.length
        ? result.map(entryState => (
          <EntryLink
            { ...entryState }
            userName={userName}
            key={`entryId=${entryState.entryId}`}
            selected={entryState.entryId === entryId}
          />
        ))
        : (
          <div className={classes.NothingYet}>
            Nothing yet!
          </div>
        )
      }

      <Link
        className={location.pathname === '/create'
          ? classes.CreateLinkSelected
          : classes.CreateLink
        }
        to="/create"
      >
        Create blog entry
      </Link>
    </div>
  );
}

UserEntryList.propTypes = {
  classes: PropTypes.object.isRequired,
  setDocumentTitle: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  entryId: PropTypes.string,
  userId: PropTypes.string,
  userName: PropTypes.string,
  query: PropTypes.any,
  queryOptions: PropTypes.object.isRequired,
  result: PropTypes.any
};

UserEntryList.defaultProps = {
  query: ({ props: { userId } }) => userId ? { entryByUserId: userId } : null,
  queryOptions: {
    select: [
      'entryByUserId',
      'entryId',
      'entryName',
      'entrySlug'
    ]
  }
};

export default UserEntryList;
