import Icon, { type IconProps } from "./Icon";

export function IconLockClosed(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

/** Distinct shape (open shackle + alert) — not just a recolor of closed lock. */
export function IconLockWarning(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
      <path d="M16.5 4.5l1 1.5" />
      <path d="M12 14v3" />
      <path d="M12 19h.01" />
    </Icon>
  );
}
