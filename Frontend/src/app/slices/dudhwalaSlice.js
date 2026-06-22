import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  configs: {
    productTypes: [],
    quantities: [],
    timeSlots: [],
    planDurations: [],
    pricing: [],
    loading: false,
    error: null
  },
  userPlans: {
    active: [],
    history: [],
    loading: false,
    error: null
  },
  currentSubscription: {
    data: null,
    processing: false,
    error: null
  }
}

const dudhwalaSlice = createSlice({
  name: 'dudhwala',
  initialState,
  reducers: {
    setConfigs(state, action) {
      state.configs = { ...state.configs, ...action.payload, loading: false }
    },
    setConfigsLoading(state, action) {
      state.configs.loading = action.payload
    },
    setConfigsError(state, action) {
      state.configs.error = action.payload
      state.configs.loading = false
    },
    setUserPlans(state, action) {
      state.userPlans = { ...state.userPlans, ...action.payload, loading: false }
    },
    setUserPlansLoading(state, action) {
      state.userPlans.loading = action.payload
    },
    setSubscriptionData(state, action) {
      state.currentSubscription.data = action.payload
    },
    setSubscriptionProcessing(state, action) {
      state.currentSubscription.processing = action.payload
    },
    resetDudhwala(state) {
      return initialState
    }
  }
})

export const {
  setConfigs,
  setConfigsLoading,
  setConfigsError,
  setUserPlans,
  setUserPlansLoading,
  setSubscriptionData,
  setSubscriptionProcessing,
  resetDudhwala
} = dudhwalaSlice.actions

export default dudhwalaSlice.reducer
