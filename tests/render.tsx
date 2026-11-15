import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { CartProvider } from "@/components/providers/cart-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

/** Renders with the providers the storefront components expect. */
export function renderWithStore(ui: ReactElement) {
  return render(
    <ToastProvider>
      <CartProvider>{ui}</CartProvider>
    </ToastProvider>,
  );
}
