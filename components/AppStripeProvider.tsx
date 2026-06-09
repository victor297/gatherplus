import { ReactElement } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

import { appConfig } from "@/config/env";

type AppStripeProviderProps = {
  children: ReactElement | ReactElement[];
};

export default function AppStripeProvider({ children }: AppStripeProviderProps) {
  return (
    <StripeProvider
      merchantIdentifier={appConfig.stripeMerchantIdentifier}
      publishableKey={appConfig.stripePublishableKey}
    >
      {children}
    </StripeProvider>
  );
}
