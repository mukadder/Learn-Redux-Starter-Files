import React, { PropTypes } from 'react';
import { Form } from 'provide-page';

const EntryCreator = ({
  classes,
  requestSession,
  entryCreationTime,
  entryError,
  createEntry,
  genEntryId,
  pushRoute,
  replaceRoute,
  setDocumentTitle,
  formId,
  formData
}) => {
  const onSubmit = (event, formData) => {
    if (!formData || !formData.entryContents) {
      return;
    }

    formData.entryByUserId = requestSession.userId;

    createEntry(formData, genEntryId, ({ entryId, entrySlug }) => {
      pushRoute(`/${requestSession.userName}/${entryId}/${entrySlug}`);
    });
  };

  setDocumentTitle('New Blog Entry');

  if (!requestSession.userId) {
    replaceRoute('/login');
  }

  return (
    <Form
      className={classes.EntryCreator}
      formId={formId}
      serverSide={true}
      onSubmit={onSubmit}
    >
      <textarea
        className={classes.EntryCreatorInput}
        name="entryContents"
        defaultValue={[
          `# New Blog Entry`,
          ``,
          `### ${new Date(entryCreationTime).toString()}`,
          ``,
          `Markdown is supported.`
        ].join('\n')}
        autoFocus
      />

      <button className={classes.SaveButton} type="submit">
        Save
      </button>

      {entryError
        ? (
          <div className={classes.EntryError}>
            {entryError}
          </div>
        )
        : undefined
      }
    </Form>
  );
};

EntryCreator.propTypes = {
  classes: PropTypes.object.isRequired,
  requestSession: PropTypes.object.isRequired,
  entryCreationTime: PropTypes.number.isRequired,
  entryError: PropTypes.string.isRequired,
  createEntry: PropTypes.func.isRequired,
  genEntryId: PropTypes.func.isRequired,
  pushRoute: PropTypes.func.isRequired,
  replaceRoute: PropTypes.func.isRequired,
  setDocumentTitle: PropTypes.func.isRequired,
  formId: PropTypes.string.isRequired,
  formData: PropTypes.object
};

EntryCreator.defaultProps = {
  formId: 'EntryCreator'
};

export default EntryCreator;
