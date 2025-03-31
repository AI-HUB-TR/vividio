import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, SubscriptionPlan, Subscription } from "@shared/schema";
import { 
  registerWithEmail, 
  loginWithEmail, 
  socialLogin as socialLoginApi, 
  logout as logoutApi, 
  getCurrentUser 
} from "@/lib/auth";

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  subscription: null,
  plan: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Async thunks
export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password, username, displayName }: { email: string; password: string; username: string; displayName?: string }, { rejectWithValue }) => {
    try {
      return await registerWithEmail(email, password, username, displayName);
    } catch (error: any) {
      return rejectWithValue(error.message || "Kayıt işlemi başarısız oldu");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await loginWithEmail(email, password);
    } catch (error: any) {
      return rejectWithValue(error.message || "Giriş başarısız oldu");
    }
  }
);

export const socialLogin = createAsyncThunk(
  "auth/socialLogin",
  async (provider: string, { rejectWithValue }) => {
    try {
      return await socialLoginApi(provider);
    } catch (error: any) {
      return rejectWithValue(error.message || "Sosyal giriş başarısız oldu");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Çıkış işlemi başarısız oldu");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentUser();
    } catch (error: any) {
      return rejectWithValue(error.message || "Kullanıcı bilgileri alınamadı");
    }
  }
);

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserSubscription: (state, action: PayloadAction<{ subscription: Subscription; plan: SubscriptionPlan }>) => {
      state.subscription = action.payload.subscription;
      state.plan = action.payload.plan;
    }
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Social Login
    builder.addCase(socialLogin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(socialLogin.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(socialLogin.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Logout
    builder.addCase(logout.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.subscription = null;
      state.plan = null;
      state.isAuthenticated = false;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch Current User
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.user = action.payload.user;
        state.subscription = action.payload.subscription;
        state.plan = action.payload.plan;
        state.isAuthenticated = true;
      } else {
        state.isAuthenticated = false;
      }
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });
  }
});

export const { clearError, updateUserSubscription } = authSlice.actions;
export default authSlice.reducer;
