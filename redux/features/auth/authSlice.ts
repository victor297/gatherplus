import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
const decodeToken = (token: string): { username: string; exp: number; sub:number; } | null => {
  try {
    const base64Url = token.split(".")[1]; // Extract payload part
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = JSON.parse(atob(base64)); // Decode JSON
    return {
      username: jsonPayload.username, // Use "username" instead of "sub"
      exp: jsonPayload.exp, // Expiry timestamp
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
        username: decodedToken.username, // Corrected key from "sub" to "username"
        role,
        accessToken: access_token,
        refreshToken: refresh_token,
        exp: decodedToken.exp,
        sub: decodedToken.sub
      };

      state.userInfo = userData;

      // Save to AsyncStorage
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


export const { setCredentials, logout,setInitialUserInfo } = authSlice.actions;

export const initializeUserInfo = () => async (dispatch: any) => {
  try {
    const userInfoString = await AsyncStorage.getItem("userInfo");
    console.log(userInfoString,"userInfoString")
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString) as UserInfo;
      console.log(userInfo,"userInfoasunc")
      dispatch(setInitialUserInfo(userInfo));
    }
  } catch (error) {
    console.error("Error initializing user info:", error);
  }
};

export default authSlice.reducer;
