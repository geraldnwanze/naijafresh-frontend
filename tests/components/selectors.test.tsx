import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PriceDisplay } from "@/components/price-display";
import { QuantitySelector } from "@/components/quantity-selector";
import { WeightSelector } from "@/components/weight-selector";

describe("QuantitySelector", () => {
  it("steps up and down", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={2} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Increase quantity"));
    await userEvent.click(screen.getByLabelText("Decrease quantity"));

    expect(onChange).toHaveBeenNthCalledWith(1, 3);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("disables the buttons at the limits", () => {
    const { rerender } = render(<QuantitySelector value={1} onChange={() => {}} min={1} max={5} />);
    expect(screen.getByLabelText("Decrease quantity")).toBeDisabled();

    rerender(<QuantitySelector value={5} onChange={() => {}} min={1} max={5} />);
    expect(screen.getByLabelText("Increase quantity")).toBeDisabled();
  });
});

describe("WeightSelector", () => {
  const rules = { min_grams: 1000, step_grams: 500, max_grams: 2000 };

  it("moves by the step and shows the weight", async () => {
    const onChange = vi.fn();
    render(<WeightSelector value={1000} onChange={onChange} rules={rules} />);

    expect(screen.getByText("1 kg")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Increase by 500 g"));
    expect(onChange).toHaveBeenCalledWith(1500);
  });

  it("stops at the minimum and the maximum", () => {
    const { rerender } = render(<WeightSelector value={1000} onChange={() => {}} rules={rules} />);
    expect(screen.getByLabelText("Decrease by 500 g")).toBeDisabled();

    rerender(<WeightSelector value={2000} onChange={() => {}} rules={rules} />);
    expect(screen.getByLabelText("Increase by 500 g")).toBeDisabled();
  });

  it("jumps to a quick-pick weight", async () => {
    const onChange = vi.fn();
    render(<WeightSelector value={1000} onChange={onChange} rules={rules} showPresets />);

    await userEvent.click(screen.getByRole("button", { name: "2 kg" }));
    expect(onChange).toHaveBeenCalledWith(2000);
  });
});

describe("PriceDisplay", () => {
  it("shows the price, suffix and a struck-through compare-at price", () => {
    render(<PriceDisplay kobo={150_000} compareAtKobo={200_000} suffix="/ kg" />);

    expect(screen.getByText("₦1,500")).toBeInTheDocument();
    expect(screen.getByText("/ kg")).toBeInTheDocument();
    expect(screen.getByText("₦2,000")).toHaveClass("line-through");
  });

  it("ignores a compare-at price that is not higher", () => {
    render(<PriceDisplay kobo={150_000} compareAtKobo={150_000} />);
    expect(screen.queryByText("₦1,500", { selector: ".line-through" })).not.toBeInTheDocument();
  });
});
