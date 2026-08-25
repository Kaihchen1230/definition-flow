import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type RequestWorkbenchState = {
  userId: string;
  selectedPageId: string | null;
  draft: Record<string, any>;
  validationMode: boolean;
};

const initialState: RequestWorkbenchState = {
  userId: "analyst",
  selectedPageId: null,
  draft: {},
  validationMode: false,
};

const requestWorkbenchSlice = createSlice({
  name: "requestWorkbench",
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setSelectedPageId: (state, action: PayloadAction<string>) => {
      state.selectedPageId = action.payload;
    },
    setDraft: (state, action: PayloadAction<Record<string, any>>) => {
      state.draft = action.payload;
    },
    enableValidationMode: (state) => {
      state.validationMode = true;
    },
  },
});

export const { setUserId, setSelectedPageId, setDraft, enableValidationMode } = requestWorkbenchSlice.actions;
export default requestWorkbenchSlice.reducer;
