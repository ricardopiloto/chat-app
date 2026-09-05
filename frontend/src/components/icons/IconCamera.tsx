import Icon, { type IconProps } from "./Icon";

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
