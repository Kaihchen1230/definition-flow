import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type RequestWorkbenchState = {
  actorId: string;
  selectedPageId: string | null;
  draft: Record<string, any>;
};

const initialState: RequestWorkbenchState = {
  actorId: "analyst",
  selectedPageId: null,
  draft: {},
};

const requestWorkbenchSlice = createSlice({
  name: "requestWorkbench",
  initialState,
  reducers: {
    setActorId: (state, action: PayloadAction<string>) => {
      state.actorId = action.payload;
    },
    setSelectedPageId: (state, action: PayloadAction<string>) => {
      state.selectedPageId = action.payload;
    },
    setDraft: (state, action: PayloadAction<Record<string, any>>) => {
      state.draft = action.payload;
    },
  },
});

export const { setActorId, setSelectedPageId, setDraft } = requestWorkbenchSlice.actions;
export default requestWorkbenchSlice.reducer;
