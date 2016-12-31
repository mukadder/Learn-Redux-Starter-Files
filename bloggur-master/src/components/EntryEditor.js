import React, { PropTypes } from 'react';
import { Form } from 'provide-page';
import { getEntryContents } from './Entry';

const cantEditMessage = `You don't have permission to edit this!`;

const EntryEditor = ({
  classes,
  userName,
  entryId,
  entryName,
  entrySlug,
  entryContents,
  entryByUserId,
  entryDeleted,
  entryError,
  updateEntry,
  deleteEntry,
  replaceRoute,
  pushRoute,
  requestSession,
  requestError,
  setRequestError,
  setStatusCode,
  setDocumentTitle,
  formId,
  formData
}) => {
  const canEdit = entryByUserId === requestSession.userId;
  const onSubmit = (event, formData) => {
    if (!formData) {
      return;
    }

    if (!canEdit) {
      setRequestError(cantEditMessage);
      return;
    }

    if (formData.entryContents) {
      updateEntry(formData, ({ entrySlug }) => {
        replaceRoute(`/${userName}/${entryId}/${entrySlug}`);
      });
    } else {
      deleteEntry(() => {
        pushRoute(`/${userName}/${entryId}/${entrySlug}`);
      });
    }
  };

  if (!canEdit) {
    entryError = cantEditMessage;
  }

  return (
    <Form
      formId={formId}
      className={classes.EntryEditor}
      onSubmit={onSubmit}
    >
      <textarea
        className={classes.EntryEditorInput}
        name="entryContents"
        defaultValue={getEntryContents({
          entryName,
          entryContents,
          entryDeleted,
          setStatusCode,
          setDocumentTitle
        })}
        autoFocus
      />

      {canEdit
        ? (
          <button className={classes.SaveButton} type="submit">
            Save
          </button>
        )
        : undefined
      }

      {requestError || entryError
        ? (
          <div className={classes.EntryError}>
            {requestError || entryError}
          </div>
        )
        : undefined
      }
    </Form>
  );
};

EntryEditor.propTypes = {
  classes: PropTypes.object.isRequired,
  userName: PropTypes.string.isRequired,
  entryId: PropTypes.string.isRequired,
  entryName: PropTypes.string.isRequired,
  entrySlug: PropTypes.string.isRequired,
  entryContents: PropTypes.string.isRequired,
  entryByUserId: PropTypes.string.isRequired,
  entryDeleted: PropTypes.bool.isRequired,
  entryError: PropTypes.string.isRequired,
  updateEntry: PropTypes.func.isRequired,
  deleteEntry: PropTypes.func.isRequired,
  replaceRoute: PropTypes.func.isRequired,
  pushRoute: PropTypes.func.isRequired,
  requestSession: PropTypes.object.isRequired,
  requestError: PropTypes.string.isRequired,
  setRequestError: PropTypes.func.isRequired,
  setStatusCode: PropTypes.func.isRequired,
  setDocumentTitle: PropTypes.func.isRequired,
  formId: PropTypes.string.isRequired,
  formData: PropTypes.object
};

EntryEditor.defaultProps = {
  formId: 'EntryEditor'
};

export default EntryEditor;
