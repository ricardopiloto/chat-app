import Icon, { type IconProps } from "./Icon";
import IconFilled from "./IconFilled";

export function IconMicOn(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
    </Icon>
  );
}

export function IconMicOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 9v2a3 3 0 0 0 5.12 2.12" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M19 11a7 7 0 0 1-1.64 4.52" />
      <path d="M5 11a7 7 0 0 0 10.35 5.85" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
      <path d="M2 2l20 20" />
    </Icon>
  );
}

/** Solid mic for call-controls (037). */
export function IconMicOnFilled(props: IconProps) {
  return (
    <IconFilled {...props}>
      <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
      <path d="M19 11a7 7 0 0 1-14 0h-2a9 9 0 0 0 8 8.94V22H9v2h6v-2h-2v-2.06A9 9 0 0 0 21 11h-2z" />
    </IconFilled>
  );
}

export function IconMicOffFilled(props: IconProps) {
  return (
    <IconFilled {...props}>
      <path d="M19 11a7.08 7.08 0 0 1-.7 3.09l1.47 1.47A8.95 8.95 0 0 0 21 11h-2zM4.27 3L3 4.27l5.01 5.01V11a4 4 0 0 0 5.91 3.52l1.8 1.8A8.88 8.88 0 0 1 12 19.94V22H9v2h6v-2h-2v-2.06a8.94 8.94 0 0 0 4.33-1.94l3.4 3.4L22 19.73 4.27 3zM12 1a4 4 0 0 0-4 4v.73l7.73 7.73A4 4 0 0 0 16 11V5a4 4 0 0 0-4-4z" />
    </IconFilled>
  );
}
