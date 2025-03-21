import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowLeftIcon } from 'lucide-react-native';
import { useVerifyuserMutation } from '@/redux/api/usersApiSlice';

export default function VerifyScreen() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const { email } = useLocalSearchParams();
  const inputRefs = useRef([]);
  const [verifyuser, { isLoading, error }] = useVerifyuserMutation();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleCodeChange = (text, index) => {
    if (text.length <= 1) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text.length === 1 && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleBackspace = (index) => {
    if (code[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join('');
    try {
      await verifyuser({ email, code: enteredCode }).unwrap();
      router.push('/(auth)/login');
    } catch (err) {
      console.error('Verification failed', err);
    }
  };

  return (
    <View className="flex-1 bg-background p-6">
         <TouchableOpacity onPress={() => router.back()} className="mt-6 flex-row items-center  justify-between">
                <ArrowLeftIcon color="grey" size={24} />
                     <Image 
                source={require('../../assets/images/logo.png')}
                  style={{ width: 150, height: 50, alignSelf: 'flex-end'}} 
                  resizeMode="contain"
                />
              </TouchableOpacity>
        

      <View className="mt-8">
        <Text className="text-white text-3xl font-bold">Email verification</Text>
        <Text className="text-gray-400 mt-2">
          We have sent a 6-digit OTP to {email ?? 'your email'}.
          Please enter the code below to verify your mail.
        </Text>

        <View className="flex-row justify-between mt-8">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={el => inputRefs.current[index] = el}
              className="w-12 h-12 bg-[#1A2432] rounded-lg text-center text-white text-xl"
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(index);
                }
              }}
            />
          ))}
        </View>

        <Text className="text-white text-center mt-8">
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </Text>

        <TouchableOpacity 
          className="bg-primary rounded-lg py-4 mt-8"
          onPress={handleVerify}
          disabled={isLoading}
        >
          
           <View className='flex-row items-center gap-2 justify-center'>
                                        <Text className="text-background  text-center text-lg font-bold">{isLoading ? 'Verifying...' : 'Verify'} </Text>
                                        <Image
                        source={require('../../assets/images/send.png')}
                        style={{ width: 24, height: 24 }}
                                      className="mr-2"
                                    />
                     </View>
        </TouchableOpacity>

        {error && <Text className="text-red-500 text-center mt-4">{error?.data?.body || 'Verification failed'}</Text>}

        <TouchableOpacity 
          onPress={() => setTimer(30)}
          disabled={timer > 0}
          className="mt-4"
        >
          <Text className="text-center">
            <Text className="text-gray-400">Didn't receive the code? </Text>
            <Text className={timer > 0 ? "text-gray-600" : "text-primary"}>
              Resend code
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
