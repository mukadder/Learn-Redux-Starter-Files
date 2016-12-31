import React, { PropTypes } from 'react';
import Markdown from 'react-remarkable';
import { Link } from 'react-router';

export function getEntryContents({
  entryName,
  entryContents,
  entryDeleted,
  setStatusCode,
  setDocumentTitle
}) {
  if (entryDeleted || !entryName) {
    setStatusCode(404);
    setDocumentTitle('404 - Entry not found!');

    if (entryDeleted) {
      entryContents = '## This entry has been deleted.';
    } else {
      entryContents = '# 404\n'
        + '\n'
        + '## Entry not found.\n';
    }
  } else {
    setStatusCode(null);
    setDocumentTitle(entryName);

    if (!entryContents) {
      entryContents = '**Loading entry...**';
    }
  }

  return entryContents;
};

const Entry = ({
  classes,
  userName,
  entryId,
  entrySlug,
  entryName,
  entryContents,
  entryDeleted,
  entryByUserId,
  requestSession,
  setStatusCode,
  setDocumentTitle
}) => (
  <div className={classes.Entry}>
    <Markdown source={getEntryContents({
      entryName,
      entryContents,
      entryDeleted,
      setStatusCode,
      setDocumentTitle
    })} />

    {entryByUserId === requestSession.userId
      ? (
        <Link
          className={classes.EditButton}
          to={`/${userName}/edit/${entryId}/${entrySlug}`}
        >
          Edit
        </Link>
      )
      : undefined
    }
  </div>
);

Entry.propTypes = {
  classes: PropTypes.object.isRequired,
  userName: PropTypes.string.isRequired,
  entryId: PropTypes.string.isRequired,
  entrySlug: PropTypes.string.isRequired,
  entryName: PropTypes.string.isRequired,
  entryContents: PropTypes.string.isRequired,
  entryDeleted: PropTypes.bool.isRequired,
  entryByUserId: PropTypes.string.isRequired,
  requestSession: PropTypes.object.isRequired,
  setStatusCode: PropTypes.func.isRequired,
  setDocumentTitle: PropTypes.func.isRequired
};

export default Entry;
