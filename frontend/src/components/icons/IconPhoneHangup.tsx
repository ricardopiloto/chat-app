import Icon, { type IconProps } from "./Icon";
import IconFilled from "./IconFilled";

export default function IconPhoneHangup(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.68 13.32a16 16 0 0 0 3 3l2.2-2.2a1 1 0 0 1 1.05-.24 11.36 11.36 0 0 0 3.58.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.58 1 1 0 0 1-.24 1.05l-2.2 2.2" />
      <path d="M22 2L2 22" />
    </Icon>
  );
}

export function IconPhoneHangupFilled(props: IconProps) {
  return (
    <IconFilled {...props}>
      <path d="M10.68 13.32c.7.7 1.6 1.5 2.5 2.2l2.2-2.2a1 1 0 0 1 1.05-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.24 1.05l-2.2 2.2c.7.9 1.5 1.8 2.55 2.49z" />
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        d="M22 2L2 22"
      />
    </IconFilled>
  );
}
