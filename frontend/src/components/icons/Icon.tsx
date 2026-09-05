import type { JSX } from "solid-js";

export type IconProps = {
  size?: number;
  title?: string;
  class?: string;
};

type SvgProps = IconProps & {
  children: JSX.Element;
};

/** Shared stroke SVG shell for Mesa icons. */
export default function Icon(props: SvgProps) {
  const size = () => props.size ?? 20;
  const decorative = () => !props.title;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      role={decorative() ? undefined : "img"}
      aria-label={decorative() ? undefined : props.title}
      aria-hidden={decorative() ? true : undefined}
    >
      {props.children}
    </svg>
  );
}
