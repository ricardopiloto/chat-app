import Icon, { type IconProps } from "./Icon";
import IconFilled from "./IconFilled";

export function IconCameraOn(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  );
}

export function IconCameraOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 2l20 20" />
      <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12.5" />
      <path d="M9.5 4H14.5L17 7h3a2 2 0 0 1 2 2v6.5" />
      <path d="M14.12 14.12A3.5 3.5 0 0 1 9.88 9.88" />
    </Icon>
  );
}

export function IconCameraOnFilled(props: IconProps) {
  return (
    <IconFilled {...props}>
      <path d="M18 10.48V6a2 2 0 0 0-2-2h-4.5l-1.76-2.12A2 2 0 0 0 8.24 1H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6.48l4 2.4V8.08l-4 2.4zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
    </IconFilled>
  );
}

export function IconCameraOffFilled(props: IconProps) {
  return (
    <IconFilled {...props}>
      <path d="M3.27 2L2 3.27l2.01 2.01A2 2 0 0 0 2 7v12a2 2 0 0 0 2 2h14.73L20 22.73 21.27 21.46 3.27 2zM9.88 9.88A3.5 3.5 0 0 0 12 15.5c.58 0 1.12-.14 1.6-.38L9.88 9.88zM18 10.48l4 2.4V8.08l-4 2.4V6c0-.35-.09-.68-.24-.97L20.73 2.06A2 2 0 0 1 22 4v12c0 .35-.09.68-.24.97L18 13.21V10.48zM9.5 4H14.5L17 7h3a2 2 0 0 1 .76.15L14.14 1.53A2 2 0 0 0 12.74 1H8.24c-.42 0-.82.13-1.15.36L9.5 4z" />
    </IconFilled>
  );
}
