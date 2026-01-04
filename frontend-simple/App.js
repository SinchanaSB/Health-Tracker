import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.201.211.101:5000"; // replace with your backend IP

export default function App() {
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ date: "", doctor: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [page, setPage] = useState("dashboard");
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");

  const bgColor = darkMode ? "#0f172a" : "#e0f2fe";
  const textColor = darkMode ? "white" : "black";

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        fetchAppointments(u.email);
      }
    };
    loadUser();
  }, []);

  const fetchAppointments = async (email) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${email}`);
      const data = await res.json();
      setAppointments(data);
    } catch {
      Alert.alert("Error", "Could not load appointments");
    }
  };

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setProfilePic(result.assets[0].uri);
  };

  const handleLogin = async () => {
    if (!email || !password || !name) return Alert.alert("Fill all fields");
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        fetchAppointments(data.user.email);
        setPage("dashboard");
        Alert.alert("✅ Login successful");
      } else Alert.alert("❌", data.message || "Login failed");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Login failed");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  const addAppointment = async () => {
    if (!newAppointment.date || !newAppointment.doctor) return Alert.alert("Enter all details");
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, ...newAppointment }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments([...appointments, data.appointment]);
        setNewAppointment({ date: "", doctor: "" });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not add appointment");
    }
  };

  const markAsDone = (appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionText("");
    setPrescriptionModal(true);
  };

  const savePrescription = async () => {
    if (!selectedAppointment) return;
    if (!prescriptionText.trim()) return Alert.alert("Enter prescription details");

    try {
      const res = await fetch(`${API_URL}/appointments/${selectedAppointment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: true, prescription: prescriptionText }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === selectedAppointment._id ? data.appointment : a))
        );
        setPrescriptionModal(false);
        setSelectedAppointment(null);
        setPrescriptionText("");
        Alert.alert("✅ Appointment marked as done with prescription!");
      } else Alert.alert("❌ Failed to save prescription");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save prescription");
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch {
      Alert.alert("Error", "Could not delete appointment");
    }
  };

  // Login page
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, padding: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: "bold", textAlign: "center", color: textColor }}>
          🏥 Health Tracker Login
        </Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={inputStyle} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} />
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={inputStyle} />
        <TouchableOpacity onPress={handleLogin} style={btnStyle("#2563eb")}>
          <Text style={btnText}>Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, padding: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: textColor }}>🏥 Health Tracker</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      {/* Menu */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
        <TouchableOpacity onPress={() => setPage("dashboard")} style={btnStyle("#2563eb")}>
          <Text style={btnText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPage("appointments")} style={btnStyle("#22c55e")}>
          <Text style={btnText}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={btnStyle("#f59e0b")}>
          <Text style={btnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard */}
      {page === "dashboard" && (
        <ScrollView contentContainerStyle={{ alignItems: "center" }}>
          <TouchableOpacity onPress={pickProfileImage}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }} />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#94a3b8",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Add</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontWeight: "bold", color: textColor }}>👋 Welcome, {user.name}</Text>
          <Text style={{ color: textColor, marginTop: 5 }}>Email: {user.email}</Text>
          <Text style={{ color: textColor, marginTop: 5 }}>📅 Appointments: {appointments.length}</Text>
        </ScrollView>
      )}

      {/* Appointments */}
      {page === "appointments" && (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={card}>
              <Text>📅 {item.date}</Text>
              <Text>👩‍⚕ Doctor: {item.doctor}</Text>
              <Text>
                ✅ Status: <Text style={{ color: item.attended ? "green" : "red" }}>{item.attended ? "Attended" : "Pending"}</Text>
              </Text>

              {!item.attended && (
                <TouchableOpacity onPress={() => markAsDone(item)} style={btnStyle("#22c55e")}>
                  <Text style={btnText}>Mark as Done</Text>
                </TouchableOpacity>
              )}

              {item.attended && (
                <Text style={{ marginTop: 5 }}>💊 Prescription: {item.prescription}</Text>
              )}

              <TouchableOpacity onPress={() => deleteAppointment(item._id)} style={btnStyle("#ef4444")}>
                <Text style={btnText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <View>
              <TextInput
                placeholder="Date (YYYY-MM-DD)"
                value={newAppointment.date}
                onChangeText={(t) => setNewAppointment({ ...newAppointment, date: t })}
                style={inputStyle}
              />
              <TextInput
                placeholder="Doctor"
                value={newAppointment.doctor}
                onChangeText={(t) => setNewAppointment({ ...newAppointment, doctor: t })}
                style={inputStyle}
              />
              <TouchableOpacity onPress={addAppointment} style={btnStyle("#2563eb")}>
                <Text style={btnText}>➕ Add Appointment</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Prescription Modal */}
      <Modal visible={prescriptionModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 10, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>💊 Enter Prescription</Text>
            <TextInput placeholder="Prescription details" value={prescriptionText} onChangeText={setPrescriptionText} style={inputStyle} />
            <TouchableOpacity onPress={savePrescription} style={btnStyle("#22c55e")}>
              <Text style={btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPrescriptionModal(false)} style={[btnStyle("#ef4444"), { marginTop: 10 }]}>
              <Text style={btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const inputStyle = { borderWidth: 1, borderRadius: 10, padding: 10, marginVertical: 6, backgroundColor: "white" };
const btnStyle = (bg) => ({ backgroundColor: bg, padding: 10, borderRadius: 10, marginTop: 10 });
const btnText = { color: "white", fontWeight: "bold", textAlign: "center" };
const card = { backgroundColor: "white", padding: 15, borderRadius: 10, marginVertical: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 };