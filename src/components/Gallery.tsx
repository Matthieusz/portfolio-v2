import {
  createSignal,
  createEffect,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import { Portal } from "solid-js/web";

interface GalleryImage {
  src: string;
  name: string;
  timestamp: number;
}

interface GalleryProps {
  images: GalleryImage[];
}

const Gallery: Component<GalleryProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [touchStart, setTouchStart] = createSignal<number | null>(null);
  const [touchEnd, setTouchEnd] = createSignal<number | null>(null);
  const [isVisible, setIsVisible] = createSignal(false);

  const minSwipeDistance = 50;

  const open = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
    const header = document.getElementById("site-header");
    if (header) header.classList.add("hidden");
    requestAnimationFrame(() => setIsVisible(true));
  };

  const close = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      document.body.style.overflow = "";
      const header = document.getElementById("site-header");
      if (header) header.classList.remove("hidden");
    }, 200);
  };

  const navigate = (direction: "prev" | "next") => {
    const len = props.images.length;
    if (len <= 1) return;

    if (direction === "next") {
      setCurrentIndex((i) => (i + 1) % len);
    } else {
      setCurrentIndex((i) => (i - 1 + len) % len);
    }
  };

  const preloadImage = (src: string) => {
    const img = new Image();
    img.src = src;
  };

  const preloadAdjacent = (index: number) => {
    const len = props.images.length;
    if (len <= 1) return;

    const prev = (index - 1 + len) % len;
    const next = (index + 1) % len;

    preloadImage(props.images[prev].src);
    preloadImage(props.images[next].src);
  };

  createEffect(() => {
    if (isOpen() && props.images.length > 0) {
      preloadAdjacent(currentIndex());
    }
  });

  createEffect(() => {
    if (!isOpen()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate("prev");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate("next");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
  });

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart() || !touchEnd()) return;

    const distance = touchStart()! - touchEnd()!;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigate("next");
    } else if (isRightSwipe) {
      navigate("prev");
    }
  };

  return (
    <>
      <button
        class="link-underline flex items-center gap-1"
        type="button"
        onClick={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <title>Gallery</title>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        Gallery
      </button>

      <Show when={isOpen()}>
        <Portal>
          <div
            class={`fixed inset-0 z-3000 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-200 ${
              isVisible() ? "opacity-100" : "opacity-0"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Image gallery"
          >
            <button
              type="button"
              class="absolute inset-0 cursor-pointer"
              onClick={close}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter") {
                  e.preventDefault();
                  close();
                }
              }}
              aria-label="Close gallery"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            <div class="absolute top-4 left-4 z-10 text-sm text-white/70">
              {currentIndex() + 1}/{props.images.length}
            </div>

            <div class="absolute bottom-8 left-1/2 z-10 max-w-[60%] -translate-x-1/2">
              <div class="truncate rounded-full bg-white/10 px-3 py-1.5 text-sm whitespace-nowrap text-white">
                {props.images[currentIndex()].name}
              </div>
            </div>

            <button
              type="button"
              class="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={close}
              aria-label="Close gallery"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <title>Close</title>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <Show when={props.images.length > 1}>
              <button
                type="button"
                class="absolute top-1/2 left-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:h-14 md:w-14"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("prev");
                }}
                aria-label="Previous image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <title>Previous</title>
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <button
                type="button"
                class="absolute top-1/2 right-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:h-14 md:w-14"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("next");
                }}
                aria-label="Next image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <title>Next</title>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </Show>

            <div
              class="relative max-h-[85vh] max-w-[90vw]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={props.images[currentIndex()].src}
                alt={props.images[currentIndex()].name}
                class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              />
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};

export default Gallery;
