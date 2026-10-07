import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src"> & {
  src: string;
};

/** next/image — lokalne ścieżki optymalizowane; zewnętrzne bez optymalizacji. */
export function SmartImage({ src, alt, unoptimized, ...rest }: Props) {
  const external =
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:");

  return (
    <Image
      src={src}
      alt={alt}
      {...rest}
      unoptimized={external || Boolean(unoptimized)}
    />
  );
}
