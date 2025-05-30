import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return alert("Lütfen e-posta ve şifre girin.");
    }

    try {
      const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = res.data;
      console.log("Giriş başarılı", user);

      if (user.role.value === "manager") {
        router.push("/admin/dashboard");
      } else {
        router.push("/supplier/dashboard");
      }
    } catch (err) {
      console.error("Giriş hatası:", err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#731e2c' }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingHorizontal: 24,
              paddingTop: 60,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 64, height: 64, marginBottom: 12 }}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: 4,
                }}
              >
                Giriş Yap
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                Devam etmek için hesabınıza giriş yapın
              </Text>
            </View>

            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              >
                <Feather
                  name="mail"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="E-posta"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, fontSize: 16 }}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              >
                <Feather
                  name="lock"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
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
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderWidth: 1,
                      borderColor: '#FBBF24',
                      backgroundColor: rememberMe ? '#FBBF24' : '#fff',
                      marginRight: 6,
                    }}
                  />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>
                    Beni Hatırla
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={{ fontSize: 14, color: '#EF4444' }}>
                    Şifremi Unuttum?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#EF4444',
                  paddingVertical: 14,
                  borderRadius: 9999,
                  alignItems: 'center',
                  marginBottom: 20,
                }}
                onPress={handleLogin}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  Giriş Yap
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 20,
                  marginBottom: 12,
                }}
              >
                <TouchableOpacity
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AntDesign name="google" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AntDesign name="apple1" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                Henüz hesabınız yok mu?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#FBBF24',
                  }}
                >
                  KAYIT OL
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
