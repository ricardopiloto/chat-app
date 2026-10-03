// Upload limits the backend enforces, mirrored so the UI can refuse early with a clear message.
const MIB = 1024 ** 2;

export const MAX_ATTACHMENT_BYTES = 5 * MIB;
export const MAX_IMAGE_BYTES = MIB; // avatars and server images
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

const PROFILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PROFILE_IMAGE_MEDIA_TYPES: ReadonlySet<string> = new Set(PROFILE_TYPES);
export const ATTACHMENT_MEDIA_TYPES: ReadonlySet<string> = new Set([...PROFILE_TYPES, "image/gif"]);
