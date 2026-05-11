import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useAuthCheck = () => {
    const { userInfo } = useSelector((state: any) => state.auth);
    const router = useRouter();

    const requireAuth = (callback?: () => void) => {
        if (!userInfo) {
            Alert.alert(
                "Authentication Required",
                "You need to be logged in to access this feature.",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Login / Sign Up",
                        onPress: () => router.push("/(auth)/login")
                    }
                ]
            );
            return false;
        }
        if (callback) {
            callback();
        }
        return true;
    };

    return { userInfo, requireAuth, isAuthenticated: !!userInfo };
};
