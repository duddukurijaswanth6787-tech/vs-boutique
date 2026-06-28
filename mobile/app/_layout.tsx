import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="details" />
      <Stack.Screen name="design" />
      <Stack.Screen name="measurements" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="Cart" />
      <Stack.Screen name="Checkout" />
      <Stack.Screen name="OrderConfirmation" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="MyOrders" />
      <Stack.Screen name="OrderTracking" />
      <Stack.Screen name="AddressList" />
      <Stack.Screen name="AddressForm" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-conditions" />
      <Stack.Screen name="refund-policy" />
      <Stack.Screen name="shipping-policy" />
      <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}