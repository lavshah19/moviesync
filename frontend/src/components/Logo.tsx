import Image from "next/image";
import logoLight from "../../public/logo-light.png";
import logoDark from "../../public/logo-dark.png";

/**
 * The moviesync logo in the right version for the theme. Pure CSS (Tailwind's `dark:` follows
 * <html data-theme>), so there's no flash on load. The hidden version is never downloaded:
 * next/image loads lazily and a display:none image is never in view.
 */
// `className` owns the wrapper's display (default inline-flex), so callers can hide/show it
// without two display classes fighting.
export function Logo({
  height = 32,
  className = "inline-flex",
}: {
  height?: number;
  className?: string;
}) {
  const width = (img: { width: number; height: number }) =>
    Math.round((height * img.width) / img.height);
  return (
    <span className={className}>
      <Image
        src={logoLight}
        alt="moviesync"
        height={height}
        width={width(logoLight)}
        className="dark:hidden"
      />
      <Image
        src={logoDark}
        alt="moviesync"
        height={height}
        width={width(logoDark)}
        className="hidden dark:block"
      />
    </span>
  );
}
