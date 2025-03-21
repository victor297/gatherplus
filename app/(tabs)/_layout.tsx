import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import { Home, Plus, User } from 'lucide-react-native';
import { Image, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function TabLayout() {
    const { userInfo } = useSelector((state:any) => state.auth);
    const router= useRouter()
  
  useFocusEffect(() => {
if (!userInfo) {
 router.push("/(auth)/login") 
}
  }, );
  return (
    <Tabs
    initialRouteName="home" 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020E1E',
          borderTopColor: '#1A2432',
          height: 68,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#9EDD45',
        tabBarInactiveTintColor: '#6B7280',
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={{ 
              padding: 16,
              borderRadius: 50,
              marginTop: -32,
              marginBottom:2
            }}>
                 <Image
                                      source={require('../../assets/images/add.png')}
                                      
                                                    className="h-20 w-20"
                                                  />
              {/* <AddIcon/> */}
            </View>
          ),
          tabBarStyle: { display: 'none' }

        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarStyle: { display: 'none' }

        }}
      />
    </Tabs>
  );
}