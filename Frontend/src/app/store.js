import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import authReducer from './slices/authSlice'
import foodReducer from './slices/foodSlice'

import quickReducer from './slices/quickSlice'
import dudhwalaReducer from './slices/dudhwalaSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    food: foodReducer,
    quick: quickReducer,
    dudhwala: dudhwalaReducer,
  },
})

export const getStoreState = () => store.getState()

export { useAuthStore } from '../core/auth/auth.store'
