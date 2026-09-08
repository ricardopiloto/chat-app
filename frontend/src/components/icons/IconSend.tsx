import Icon, { type IconProps } from "./Icon";

/** Paper-plane send control (Telegram-like). */
export default function IconSend(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" />
    </Icon>
  );
}
