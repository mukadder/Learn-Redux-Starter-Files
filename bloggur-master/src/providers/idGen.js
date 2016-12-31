import provideIdGen from 'provide-id-gen';

const idGen = provideIdGen([
  'user',
  'entry'
]);

idGen.isGlobal = true;

export default idGen;
