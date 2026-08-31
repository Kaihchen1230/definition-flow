import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type RequestWorkbenchState = {
  userId: string;
  requestCaseId: string;
  selectedPageId: string | null;
  draft: Record<string, any>;
  validationMode: boolean;
  hasUnsavedChanges: boolean;
};

const initialState: RequestWorkbenchState = {
  userId: "analyst",
  requestCaseId: "",
  selectedPageId: null,
  draft: {},
  validationMode: false,
  hasUnsavedChanges: false,
};

const requestWorkbenchSlice = createSlice({
  name: "requestWorkbench",
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
      state.hasUnsavedChanges = false;
    },
    setRequestCaseId: (state, action: PayloadAction<string>) => {
      state.requestCaseId = action.payload;
      state.selectedPageId = null;
      state.validationMode = false;
      state.hasUnsavedChanges = false;
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
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
  },
});

export const { setUserId, setRequestCaseId, setSelectedPageId, setDraft, enableValidationMode, setHasUnsavedChanges } = requestWorkbenchSlice.actions;
export default requestWorkbenchSlice.reducer;
