import Icon, { type IconProps } from "./Icon";

/** Headphones / listening glyph for voice roster (033). No deafen variant. */
export default function IconHeadphones(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M21 16a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z" />
      <path d="M3 16a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z" />
    </Icon>
  );
}
