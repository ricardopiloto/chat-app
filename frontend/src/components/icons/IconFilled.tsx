import type { JSX } from "solid-js";
import type { IconProps } from "./Icon";

type SvgProps = IconProps & {
  children: JSX.Element;
};

/** Filled glyph shell for call-control primary icons (037). */
export default function IconFilled(props: SvgProps) {
  const size = () => props.size ?? 20;
  const decorative = () => !props.title;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      class={props.class}
      role={decorative() ? undefined : "img"}
      aria-label={decorative() ? undefined : props.title}
      aria-hidden={decorative() ? true : undefined}
    >
      {props.children}
    </svg>
  );
}
