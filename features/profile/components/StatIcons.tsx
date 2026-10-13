/**
 * The Performance Summary stat icons are custom tiles in the Figma file
 * (black rounded square + white glyph, 24×24). folder-check and
 * file-code do not exist in the project's boxicons 2.1.4 font, and its
 * "note" is only a plain glyph — so these are the design's own SVG
 * assets, downloaded from Figma and kept verbatim at their root size.
 */
export function FolderCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="block shrink-0"
    >
      <rect width="24" height="24" rx="4" fill="black" />
      <path
        d="M18.4 5.55556H11.528L10.4 4.45889C10.096 4.16333 9.696 4 9.272 4H5.6C4.72 4 4 4.7 4 5.55556V16.4444C4 17.3 4.72 18 5.6 18H18.4C19.28 18 20 17.3 20 16.4444V7.11111C20 6.25556 19.28 5.55556 18.4 5.55556ZM18.4 16.4444H5.6V7.11111H18.4V16.4444Z"
        fill="white"
      />
      <path
        d="M9.20594 10.6854L8 11.882L11.1507 15L16 10.1966L14.7941 9L11.1507 12.6236L9.20594 10.6854Z"
        fill="white"
      />
    </svg>
  );
}

export function NoteIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="block shrink-0"
    >
      <rect width="24" height="24" rx="4" fill="black" />
      <path
        d="M16.6667 6H7.33333C6.6 6 6 6.6 6 7.33333V16.6667C6 17.4 6.6 18 7.33333 18H12.6667C12.7533 18 12.84 17.98 12.92 17.9467C13 17.9133 13.0733 17.8667 13.14 17.8L17.8067 13.1333C17.8667 13.0733 17.9067 13.0067 17.94 12.94L17.96 12.88C17.98 12.8267 17.9933 12.7667 17.9933 12.7067C17.9933 12.6933 18 12.68 18 12.6667V7.33333C18 6.6 17.4 6 16.6667 6ZM7.33333 7.33333H16.6667V12H12.6667C12.3 12 12 12.3 12 12.6667V16.6667H7.33333V7.33333Z"
        fill="white"
      />
    </svg>
  );
}

export function FileCodeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="block shrink-0"
    >
      <rect width="24" height="24" rx="4" fill="black" />
      <path
        d="M10.4806 11.5216L8 14.01L10.4806 16.4984L11.5814 15.3976L10.186 14.01L11.5814 12.6224L10.4806 11.5216ZM12.4186 12.6224L13.814 14.01L12.4186 15.3976L13.5194 16.4984L16 14.01L13.5194 11.5216L12.4186 12.6224Z"
        fill="white"
      />
      <path
        d="M17.955 8.97901L17.9325 8.91601C17.8993 8.83878 17.848 8.76943 17.7825 8.71301L14.0325 5.21301C13.965 5.15001 13.89 5.10801 13.815 5.07301L13.7475 5.05201C13.685 5.03032 13.6191 5.01849 13.5525 5.01701C13.5375 5.01701 13.5225 5.01001 13.5075 5.01001H7.5C6.675 5.01001 6 5.64001 6 6.41001V17.61C6 18.38 6.675 19.01 7.5 19.01H16.5C17.325 19.01 18 18.38 18 17.61V9.21001C18 9.21001 17.9925 9.18201 17.9925 9.16801C17.9925 9.10501 17.9775 9.04901 17.955 8.98601V8.97901ZM7.5 17.603V6.40301H12.75V9.20301C12.75 9.58801 13.0875 9.90301 13.5 9.90301H16.5V17.603H7.5Z"
        fill="white"
      />
    </svg>
  );
}
