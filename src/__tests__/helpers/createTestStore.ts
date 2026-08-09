import {configureStore} from '@reduxjs/toolkit';
import {expenseSlice} from '../../store/expenseSlice';

export function createTestStore() {
  return configureStore({
    reducer: {
      [expenseSlice.name]: expenseSlice.reducer,
    },
  });
}

export type TestStore = ReturnType<typeof createTestStore>;
