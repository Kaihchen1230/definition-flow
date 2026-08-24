import { configureStore } from "@reduxjs/toolkit";
import { approvalApi } from "../services/approvalApi";
import requestWorkbenchReducer from "../features/request-workbench/requestWorkbenchSlice";

export const createStore = () => configureStore({
  reducer: {
    requestWorkbench: requestWorkbenchReducer,
    [approvalApi.reducerPath]: approvalApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(approvalApi.middleware),
});

export const store = createStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
