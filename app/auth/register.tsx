import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import { router } from "expo-router";
import axios from "axios";

// const roles = [
//   { label: "Tasarımcı", value: "designer" },
//   { label: "Proje Yöneticisi", value: "manager" },
//   { label: "İç Mimar", value: "interior" },
//   { label: "Peyzaj Mimarı", value: "landscape" },
//   { label: "Uygulamacı", value: "contractor" },
//   { label: "Tedarikçi", value: "supplier" },
// ];

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [role, setRole] = useState(null);
  const [roleList, setRoleList] = useState([]);

  useEffect(() => {
    axios
        .get(`${process.env.EXPO_PUBLIC_API_URL}/api/roles`)
        .then(res => setRoleList(res.data))
        .catch(err => console.error("Rol verileri alınamadı:", err));
  }, [])

  const handleRegister = async () => {
    if (!agree) return alert("Lütfen kullanım koşullarını kabul edin.");
    if (!username || !email || !phone || !password || !role)
      return alert("Lütfen tüm alanları doldurun.");

    try {
      const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
        name: username,
        email,
        phone,
        password,
        role,
      });

      alert("Kayıt başarılı!");
      router.push("/auth/login");
    } catch (err) {
      console.log("Kayıt hatası:", err);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#731e2c" }}>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingHorizontal: 24,
              paddingTop: 60,
              justifyContent: "space-between",
            }}
          >
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={{ alignItems: "center" }}
            >
              <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 64, height: 64, marginBottom: 12 }}
              />
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
                Kayıt Ol
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
                Başlamak için hesabınızı oluşturun
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100).duration(500)}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 9999,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
              }}>
                <Feather name="user" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Kullanıcı Adı"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, fontSize: 16 }}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 9999,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
              }}>
                <Feather name="mail" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="E-posta"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, fontSize: 16 }}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 9999,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
              }}>
                <Feather name="phone" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Telefon Numarası"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={{ flex: 1, fontSize: 16 }}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 9999,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
              }}>
                <Feather name="lock" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Şifre"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, fontSize: 16 }}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Dropdown
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 9999,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                  placeholderStyle={{ color: "#9CA3AF", fontSize: 16 }}
                  selectedTextStyle={{ fontSize: 16 }}
                  data={roleList}
                  labelField="label"
                  valueField="_id"
                  placeholder="Mesleğinizi seçin"
                  value={role}
                  onChange={(item) => {
                    console.log("Seçilen Rol", item);
                    setRole(item._id);
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={() => setAgree(!agree)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderWidth: 1,
                    borderColor: "#10B981",
                    backgroundColor: agree ? "#10B981" : "#fff",
                    marginRight: 8,
                  }}
                />
                <Text style={{ fontSize: 14, color: "#6B7280" }}>
                  Kullanım koşullarını kabul ediyorum
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#EF4444",
                  paddingVertical: 14,
                  borderRadius: 9999,
                  alignItems: "center",
                  marginBottom: 24,
                }}
                onPress={handleRegister}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                  Kayıt Ol
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                Zaten hesabınız var mı?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text
                  style={{ fontSize: 14, fontWeight: "bold", color: "#FBBF24" }}
                >
                  GİRİŞ YAP
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
