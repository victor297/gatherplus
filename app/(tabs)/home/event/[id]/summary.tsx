import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Rect, Circle } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { useCreateBookingMutation } from '@/redux/api/eventsApiSlice';
import { Paystack } from 'react-native-paystack-webview';
import { CardField, useStripe } from '@stripe/stripe-react-native';

export default function OrderSummaryScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const bookingData = JSON.parse(data as string);
  const [createBooking, { isLoading: isBookmarkLoading }] = useCreateBookingMutation();
  
  // Payment states
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<"Stripe" | "PayStack" | null>(null);
  const { confirmPayment } = useStripe();
  const [paystackKey] = useState('pk_test_24f80340f75a34e90b00aa800e59608dfd6a0b06'); // Replace with your Paystack public key
  const [stripeLoading, setStripeLoading] = useState(false);

  // Calculate totals
  const ticketGroups = bookingData.bookings.reduce((groups: any, booking: any) => {
    const name = booking.name;
    if (!groups[name]) {
      groups[name] = { count: 0, total: 0 };
    }
    groups[name].count++;
    groups[name].total += booking.price;
    return groups;
  }, {});

  const subtotal = bookingData.bookings.reduce((sum: any, booking: any) => sum + booking.price, 0);
  const tax = 0;
  const total = subtotal + tax;

  const handleBookEvent = async () => {
    if (!selectedChannel) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    try {
      const bookingPayload = {
        ...bookingData,
        channel: selectedChannel, // Add the selected channel to the payload
      };
      const res = await createBooking(bookingPayload).unwrap();
      setPaymentResponse(res);
console.log(res,"resres")
      if (selectedChannel === "PayStack" && res?.message==="SUCCESSFUL") {
        console.log(res,"resrespay")

        // Paystack payment will be handled by the Paystack component
        return;
      } else if (selectedChannel === "Stripe" && res?.message==="SUCCESSFUL") {
        await handleStripePayment("https://buy.stripe.com/test_6oEdSJ0nNcaA7L24gg");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to process payment");
      console.log(err);
    }
  };

  const handleStripePayment = async (clientSecret: string) => {
    try {
      setStripeLoading(true);
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',paymentMethodData:{
          billingDetails: {
            email: 'test@example.com',
            name: 'Test User',
            address: {
              line1: '123 Main Street',
              city: 'Lagos',
              postalCode: '101001',
              country: 'NG',
            },
            phone:"09087686677"
          },
          
        },
       
      });
    

      if (error) {
        Alert.alert("Payment Error", error.message);
        console.log("Payment Error", error.message);
      } else if (paymentIntent) {
        router.push(`/home/event/${bookingData.event_id}/success`);
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong with Stripe payment");
    } finally {
      setStripeLoading(false);
    }
  };

  const handlePaystackSuccess = (response: any) => {
    if (response.status === "success") {
      router.push(`/home/event/${bookingData.event_id}/success`);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Order Summary</Text>
      </View>

      {/* Order Details */}
      <ScrollView className="flex-1 px-4">
        <Text className="text-white text-xl mb-4">Tickets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bookingData.bookings.map((booking: any, index: any) => (
            <View className="relative w-80 m-1" key={`${booking.ticket_id}-${index}`}>
              <Svg height="100" width="100%" viewBox="0 0 520 160">
                <Rect x="0" y="0" width="520" height="160" rx="10" ry="10" fill="white" stroke="gray" strokeWidth="2" />
                <Circle cx="0" cy="80" r="20" fill="#020e1e" stroke="#020e1e" strokeWidth="2" />
                <Circle cx="520" cy="80" r="20" fill="#020e1e" stroke="#020e1e" strokeWidth="2" />
              </Svg>
              <View className="absolute top-0 left-0 w-full h-full flex justify-center items-center p-4">
                <Text className="text-lg font-bold text-blue-600 text-center">{booking.name}</Text>
                <View className='flex-row justify-center gap-2 items-center'>
                  <QRCode value={`${booking.session_id}-${booking.ticket_id}-${index}`} size={50} />
                  <View>
                    <Text className="text-base text-gray-700">{booking.fullname}</Text>
                    <Text className="text-sm text-gray-500">{booking.email}</Text>
                  </View>
                  <Text className="text-white font-bold text-sm bg-blue-600 p-1 rounded-full">
                    {booking?.price == 0 ? 'Free' : `${bookingData?.currency?.split(' - ')[0]} ${booking.price.toLocaleString()}`}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Order Summary */}
        <View className="mt-6">
          <Text className="text-white text-xl mb-4">Order Details</Text>
          <View className="space-y-3">
            {Object.entries(ticketGroups).map(([name, group]: any) => (
              <View className="flex-row justify-between" key={name}>
                <Text className="text-gray-400">{name}</Text>
                <Text className="text-white">
                  {group?.count} × {bookingData?.currency} {(group?.total / group?.count).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
          <View className="h-[1px] bg-[#1A2432] my-4" />
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Sub-total</Text>
              <Text className="text-white">{bookingData?.currency} {subtotal.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Tax</Text>
              <Text className="text-white">{bookingData?.currency} {tax.toLocaleString()}</Text>
            </View>
          </View>
          <View className="h-[1px] bg-[#1A2432] my-4" />
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-primary text-xl font-bold">{bookingData?.currency} {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View className="mt-6">
          <Text className="text-white text-xl mb-4">Select Payment Method</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className={`flex-1 mr-2 p-4 rounded-lg ${selectedChannel === "Stripe" ? 'bg-primary' : 'bg-gray-800'}`}
              onPress={() => setSelectedChannel("Stripe")}
            >
              <Text className="text-white text-center font-semibold">Stripe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 ml-2 p-4 rounded-lg ${selectedChannel === "PayStack" ? 'bg-primary' : 'bg-gray-800'}`}
              onPress={() => setSelectedChannel("PayStack")}
            >
              <Text className="text-white text-center font-semibold">Paystack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Payment Section */}
      <View className="p-4 border-t border-[#1A2432]">
        {selectedChannel === "PayStack" && paymentResponse?.message==="SUCCESSFUL"&& (
          <Paystack
            paystackKey={paystackKey}
            amount={total}
            currency={bookingData?.currency}
            billingEmail={bookingData.bookings[0].email}
            activityIndicatorColor="green"
            onCancel={() => Alert.alert("Payment Cancelled")}
            onSuccess={handlePaystackSuccess}
            autoStart={true}
            // refNumber={paymentResponse.body.reference}
            channels={['card', 'bank', 'ussd', 'qr', 'mobile_money']}
            render={(paystack: any) => (
              <TouchableOpacity
                className="bg-primary rounded-lg py-4"
                onPress={() => paystack.startPayment()}
                disabled={isBookmarkLoading}
              >
                <Text className="text-background text-center font-semibold">
                  Pay Now with Paystack
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

{selectedChannel === "Stripe" && (
  <View>
   <CardField
  postalCodeEnabled={true}
  placeholders={{
    number: '4242 4242 4242 4242',
  }}
  cardStyle={{
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  }}
  style={{
    width: '100%',
    height: 150,
    marginVertical: 30,
  }}
  onCardChange={(cardDetails) => {
    console.log('Card details:', cardDetails);
  }}
  onFocus={(focusedField) => {
    console.log('Focused field:', focusedField);
  }}
/>

    <TouchableOpacity
      className="bg-primary rounded-lg py-4"
      onPress={handleBookEvent}
      disabled={isBookmarkLoading || stripeLoading}
    >
      <Text className="text-background text-center font-semibold">
        {stripeLoading ? "Processing..." : "Pay Now with Stripe"}
      </Text>
    </TouchableOpacity>
  </View>
)}

        {!paymentResponse && (
          <TouchableOpacity
            className="bg-primary rounded-lg py-4"
            onPress={handleBookEvent}
            disabled={isBookmarkLoading || !selectedChannel}
          >
            <Text className="text-background text-center font-semibold">
              Proceed to Payment
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}