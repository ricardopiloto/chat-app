import Icon, { type IconProps } from "./Icon";

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}

/** Chevron plus a diamond pip — shape (not colour) marks blur-on. */
export function IconChevronDownBlur(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="6 8 12 14 18 8" />
      <path d="M12 16.5 L14 18.5 L12 20.5 L10 18.5 Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}
