import provideCrud from 'provide-crud';

const entry = provideCrud('entry', {
  byUserId: '',
  contents: '',
  name: '',
  slug: '',
  creationTime: new Date().getTime(),
  error: ''
});

function getEntryName(entryContents = '') {
  return entryContents
    .split('\n')
    .shift()
    .replace(/^#/, '')
    .trim();
}

function getEntrySlug(entryName = '') {
  return entryName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/gi, '')
    .trim()
    .replace(/ /gi, '-');
}

const { createEntry } = entry.actions;
entry.actions.createEntry = (state, genId, onSuccess) => {
  if (!state.entryByUserId) {
    return entry.actions.setEntryError('Invalid user ID!')
  }

  if (!state.entryContents) {
    return entry.actions.setEntryError('Blank entries not allowed!');
  }

  if (!state.entryName) {
    state.entryName = getEntryName(state.entryContents);
  }

  if (!state.entrySlug) {
    state.entrySlug = getEntrySlug(state.entryName);
  }

  state.entryCreationTime = new Date().getTime();

  return createEntry(state, genId, onSuccess);
};

const { updateEntry } = entry.actions;
entry.actions.updateEntry = (updates, onSuccess) => {
  if (updates.entryContents) {
    if (!updates.entryName) {
      updates.entryName = getEntryName(updates.entryContents);
    }

    if (!updates.entrySlug) {
      updates.entrySlug = getEntrySlug(updates.entryName);
    }
  }

  return updateEntry(updates, onSuccess);
};

entry.replication.baseQueryOptions = {
  sortBy: {
    entryCreationTime: -1
  }
};

export default entry;
