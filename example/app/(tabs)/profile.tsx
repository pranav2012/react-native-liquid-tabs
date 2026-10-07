import { StyleSheet, Text, TextInput, useColorScheme } from "react-native";
import { DemoFeed } from "../../components/DemoFeed";

export default function Profile() {
  const dark = useColorScheme() === "dark";
  const color = dark ? "#fff" : "#000";
  return (
    <DemoFeed title="Profile" seed={8}>
      <TextInput placeholder="Type here: the Android bar hides with the keyboard" placeholderTextColor="#8E8E93" style={[styles.input, { color, borderColor: dark ? "#333" : "#ddd" }]} />
      <Text style={{ color: "#8E8E93" }}>Drag along the tab bar to move the lens between tabs.</Text>
    </DemoFeed>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
});
