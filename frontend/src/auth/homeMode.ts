export function homeMode(marker: string | undefined): "marketing" | "public" {
  return marker === "marketing" ? "marketing" : "public";
}
