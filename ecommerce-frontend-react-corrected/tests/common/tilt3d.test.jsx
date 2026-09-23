import { fireEvent, screen } from "@testing-library/react";
import Tilt3D from "../../src/common/tilt3d";
import { render } from "@testing-library/react";

test("Tilt3D updates and resets transform CSS variables", () => {
  const { container } = render(
    <Tilt3D className="custom" max={10}>
      <span>Content</span>
    </Tilt3D>,
  );
  const wrapper = container.firstElementChild;
  wrapper.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });

  fireEvent.mouseMove(wrapper, { clientX: 75, clientY: 25 });
  expect(wrapper.style.getPropertyValue("--rx")).toBe("5deg");
  expect(wrapper.style.getPropertyValue("--ry")).toBe("5deg");
  expect(wrapper.style.getPropertyValue("--mx")).toBe("75%");
  expect(wrapper.style.getPropertyValue("--my")).toBe("25%");

  fireEvent.mouseLeave(wrapper);
  expect(wrapper.style.getPropertyValue("--rx")).toBe("0deg");
  expect(wrapper.style.getPropertyValue("--ry")).toBe("0deg");
  expect(screen.getByText("Content")).toBeInTheDocument();
});
