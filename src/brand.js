// ----- Branding switch -----
// The app ships under the neutral, commercially-safe "BracketLive" identity so
// it carries no FIFA trademarks (emblem, "World Cup" wordmark). Flip this to
// true for a personal build that shows the official FIFA emblem + naming.
//
// IMPORTANT: keep this false for any public/commercial deployment. The official
// 2026 emblem and "FIFA World Cup" name are protected marks.
export const OFFICIAL_BRANDING = true;

export const BRAND = {
  // Top-left product name.
  name: OFFICIAL_BRANDING ? 'World Cup 2026' : 'BracketLive',
  // Alt text for the center mark.
  markAlt: OFFICIAL_BRANDING ? 'FIFA World Cup 2026 emblem' : 'BracketLive logo',
};
