import Icon, { type IconProps } from "./Icon";

export default function IconReply(props: IconProps) {
  return (
    <Icon {...props} size={props.size ?? 16}>
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </Icon>
  );
}
