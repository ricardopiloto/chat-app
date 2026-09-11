import Icon, { type IconProps } from "./Icon";
import IconFilled from "./IconFilled";

/** Screen / display share (082). */
export function IconScreenShare(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  );
}

export function IconScreenShareFilled(props: IconProps) {
  return (
    <IconFilled {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </IconFilled>
  );
}

export function IconScreenShareOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 2l20 20" />
      <path d="M6.5 3H20a2 2 0 0 1 2 2v10c0 .4-.12.77-.32 1.08" />
      <path d="M2 5.5V15a2 2 0 0 0 2 2h11.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  );
}
