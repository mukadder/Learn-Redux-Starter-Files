import 'react-redux-provide/lib/install';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { pushReplicator } from 'react-redux-provide';
import fs from 'redux-replicate-fs';
import App from './components/App';
import defaultProps from './defaultProps';
import bcrypt from 'bcrypt';

const { providers } = defaultProps;
const min = process.env.MIN_EXT || '';
const themes = require(`./themes/index${min}`);

providers.theme.state.themes = themes;
providers.user.state = { userPasswordHasher: bcrypt };

// NOTE: you might want to use different replicator(s) here, if any
pushReplicator(providers, fs);

function renderAppToString(props = defaultProps) {
  return renderToString(<App { ...props } />);
}

export default renderAppToString;
