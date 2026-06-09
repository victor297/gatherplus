import { ReactElement } from "react";

type AppStripeProviderProps = {
  children: ReactElement | ReactElement[];
};

export default function AppStripeProvider({ children }: AppStripeProviderProps) {
  return <>{children}</>;
}
