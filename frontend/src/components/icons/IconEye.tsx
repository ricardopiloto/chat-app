import Icon, { type IconProps } from "./Icon";

export function IconEyeOpen(props: IconProps) {
  return (
    <Icon {...props} size={props.size ?? 18}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <Icon {...props} size={props.size ?? 18}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.1" />
      <path d="M6.1 6.1C3.9 7.8 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9" />
    </Icon>
  );
}
