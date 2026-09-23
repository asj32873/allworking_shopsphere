import React from "react";
import { screen } from "@testing-library/react";
import PortalLayout from "../../../src/components/common/PortalLayout";
import { renderWithProviders } from "../../utils/testUtils";

describe("PortalLayout component", () => {
  test("renders role sidebar and child content inside layout", () => {
    renderWithProviders(
      <PortalLayout type="vendor">
        <div>Custom Portal Dashboard Content</div>
      </PortalLayout>,
    );

    expect(screen.getByText("vendor portal")).toBeInTheDocument();
    expect(screen.getByText("Custom Portal Dashboard Content")).toBeInTheDocument();
  });
});
