from pathlib import Path

from PIL import Image


NEWS_DIR = Path("assets/news")
TARGETS = [
    "gamescom-2026-showcase.png",
    "gta-vi-leak-editorial.png",
    "horizon-hunters-gathering.png",
    "next-gen-console-pricing.png",
    "phantom-blade-zero-preview.png",
    "pokemon-tcg-30th-celebration.png",
]


def optimize_image(source: Path) -> tuple[int, int]:
    output = source.with_suffix(".jpg")
    original_bytes = source.stat().st_size

    with Image.open(source) as image:
        rgb_image = image.convert("RGB")
        rgb_image.save(
            output,
            "JPEG",
            quality=84,
            optimize=True,
            progressive=True,
            subsampling="4:2:0",
        )

    return original_bytes, output.stat().st_size


def main() -> None:
    for filename in TARGETS:
        source = NEWS_DIR / filename
        if not source.exists():
            raise FileNotFoundError(source)

        original_bytes, optimized_bytes = optimize_image(source)
        savings = 1 - (optimized_bytes / original_bytes)
        print(
            f"{source.name} -> {source.with_suffix('.jpg').name}: "
            f"{original_bytes:,} to {optimized_bytes:,} bytes "
            f"({savings:.0%} smaller)"
        )


if __name__ == "__main__":
    main()
