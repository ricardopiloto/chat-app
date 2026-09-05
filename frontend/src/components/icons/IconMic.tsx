import Icon, { type IconProps } from "./Icon";

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
