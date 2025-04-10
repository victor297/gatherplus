import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"; // If navigation is needed in thunk

interface UserInfo {
  username: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  exp: number; // Expiry timestamp in seconds
  sub: number;
}

interface AuthState {
  userInfo: UserInfo | null;
}

const initialState: AuthState = {
  userInfo: null,
};

// Function to decode JWT token
const decodeToken = (token: string): { username: string; exp: number; sub: number } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = JSON.parse(atob(base64));
    return {
      username: jsonPayload.username,
      exp: jsonPayload.exp,
      sub: jsonPayload.sub,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ body: { role: string; access_token: string; refresh_token: string } }>
    ) => {
      const { role, access_token, refresh_token } = action.payload.body;
      const decodedToken = decodeToken(access_token);

      if (!decodedToken) {
        console.error("Invalid token");
        return;
      }

      const userData = {
        username: decodedToken.username,
        role,
        accessToken: access_token,
        refreshToken: refresh_token,
        exp: decodedToken.exp,
        sub: decodedToken.sub,
      };

      state.userInfo = userData;
      AsyncStorage.setItem("userInfo", JSON.stringify(userData));
      AsyncStorage.setItem("expiryTime", decodedToken.exp.toString());
    },
    logout: (state) => {
      state.userInfo = null;
      AsyncStorage.removeItem("userInfo");
      AsyncStorage.removeItem("expiryTime");
    },
    setInitialUserInfo: (state, action: PayloadAction<UserInfo | null>) => {
      state.userInfo = action.payload;
    },
  },
});

export const { setCredentials, logout, setInitialUserInfo } = authSlice.actions;

// Thunk to initialize user info and start expiration check
export const initializeUserInfo = () => async (dispatch: any) => {
  try {
    const userInfoString = await AsyncStorage.getItem("userInfo");
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString) as UserInfo;
      dispatch(setInitialUserInfo(userInfo));
      dispatch(startTokenExpirationCheck()); // Start the timer
    }
  } catch (error) {
    console.error("Error initializing user info:", error);
  }
};

// Thunk to check token expiration and logout 5 minutes before
export const startTokenExpirationCheck = () => (dispatch: any, getState: any) => {
  const checkExpiration = () => {
    const state = getState();
    const { userInfo } = state.auth;

    if (!userInfo || !userInfo.exp) return;

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeToExpiry = userInfo.exp - currentTime;
    const fiveMinutes = 300; // 5 minutes in seconds

    if (timeToExpiry <= fiveMinutes) {
      console.log("Token expiring soon, logging out...");
      dispatch(logout());
      // Navigation can be handled in the component, not here
    }
  };

  // Check every 30 seconds
  const intervalId = setInterval(checkExpiration, 30 * 1000);

  // Return a cleanup function to clear the interval
  return () => clearInterval(intervalId);
};

export default authSlice.reducer;