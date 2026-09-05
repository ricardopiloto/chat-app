import Icon, { type IconProps } from "./Icon";

/** Current theme is dark — moon represents active dark mode. */
export default function IconMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
    </Icon>
  );
}
