import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TabIcons } from "react-native-liquid-tabs";
import { liquidTabBar } from "react-native-liquid-tabs/react-navigation";
import { DemoFeed } from "./components/DemoFeed";

const Tab = createBottomTabNavigator();

const Feed = () => <DemoFeed title="Feed" seed={1} />;
const Messages = () => <DemoFeed title="Messages" seed={4} />;
const Calendar = () => <DemoFeed title="Calendar" seed={7} />;

export default function App() {
  const dark = useColorScheme() === "dark";
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer theme={dark ? DarkTheme : DefaultTheme}>
          <Tab.Navigator
            screenOptions={{ headerShown: false }}
            {...liquidTabBar({
              dark,
              backgroundColor: dark ? "#000000" : "#FFFFFF",
              icons: { Feed: TabIcons.home, Messages: TabIcons.chat, Calendar: TabIcons.calendar },
            })}
          >
            <Tab.Screen name="Feed" component={Feed} />
            <Tab.Screen name="Messages" component={Messages} />
            <Tab.Screen name="Calendar" component={Calendar} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
