https://medium.com/@timbur/react-automatic-redux-providers-and-replicators-c4e35a39f1#.en6w6vd0z

[![build status](https://img.shields.io/travis/loggur/bloggur/master.svg?style=flat-square)](https://travis-ci.org/loggur/bloggur) [![npm version](https://img.shields.io/npm/v/bloggur.svg?style=flat-square)](https://www.npmjs.com/package/bloggur)
[![npm downloads](https://img.shields.io/npm/dm/bloggur.svg?style=flat-square)](https://www.npmjs.com/package/bloggur)

A simple blog application built with `react-redux-provide`. Demonstrates truly universal rendering with replication and queries.


## What's included?

- Setup
  - [Babel 6 w/ early stage features](https://babeljs.io/)
  - [Webpack](https://webpack.github.io/)
  - [Express](http://expressjs.com/)
  - [Gzip compression](https://www.npmjs.com/package/compression)
  - [SSL config in production w/ redirect](https://github.com/loggur/bloggur/blob/master/server.production.js)
  - [Hot reloading (both client and server)](https://github.com/gaearon/react-transform-hmr)
  - [Static files directory](http://expressjs.com/en/starter/static-files.html)
  - [Test utilities](https://mochajs.org/)
  - [Windows environment support](https://github.com/benoror/better-npm-run)

- Libraries
  - [React](https://facebook.github.io/react/)
  - [CSS modules](https://github.com/css-modules/css-modules)
  - [Redux providers](https://github.com/loggur/react-redux-provide)
  - [Replication (client: localforage; server: flat files)](https://github.com/loggur/redux-replicate)

- Providers
  - [Routing](https://github.com/loggur/provide-router) w/ [Server rendering](https://github.com/loggur/provide-page)
  - [Themes](https://github.com/loggur/provide-theme)
  - [ID generation](https://github.com/loggur/provide-id-gen)
  - [Users (creation and authentication)](https://github.com/loggur/provide-user)
