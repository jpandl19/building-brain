import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  exampleData: [],
};

export const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    /* eslint-disable no-param-reassign */
    // Note: we're very intentionally disabling this rule, only for this block
    //     |Redux Toolkit allows us to write "mutating" logic in reducers. It
    //     |doesn't actually mutate the state because it uses the Immer library,
    //     |which detects changes to a "draft state" and produces a brand new
    //     |immutable state based off those changes
    exampleFunc: (state, data) => {
      const item = data.payload;
      state = { ...state, ...item };
    },
  },
});
/* eslint-enable no-param-reassign */

// Action creators are generated for each case reducer function
export const {
  exampleFunc,
} = exampleSlice.actions;

export default exampleSlice.reducer;
