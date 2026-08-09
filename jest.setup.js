jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('firebase/firestore/lite', () =>
  require('./src/__tests__/helpers/mockFirebase').firebaseFirestoreLiteMock);

jest.mock('./src/firebase/firebaseConfig', () =>
  require('./src/__tests__/helpers/mockFirebase').firebaseConfigMock);
