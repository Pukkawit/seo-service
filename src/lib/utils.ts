import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Utility function to convert hex color to HSL
export function hexToHsl(hex: string) {
  let r = 0,
    g = 0,
    b = 0;
  // Handle #RGB format
  if (hex.length === 4) {
    r = Number.parseInt(hex[1] + hex[1], 16);
    g = Number.parseInt(hex[2] + hex[2], 16);
    b = Number.parseInt(hex[3] + hex[3], 16);
  }
  // Handle #RRGGBB format
  else if (hex.length === 7) {
    r = Number.parseInt(hex.substring(1, 3), 16);
    g = Number.parseInt(hex.substring(3, 5), 16);
    b = Number.parseInt(hex.substring(5, 7), 16);
  } else {
    console.warn("Invalid hex color format:", hex);
    return null;
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export function getIndefiniteArticle(nextWord: string) {
  if (!nextWord || typeof nextWord !== "string") return "a"; // Fallback for invalid input <sup data-citation="1" className="inline select-none [&>a]:rounded-2xl [&>a]:border [&>a]:px-1.5 [&>a]:py-0.5 [&>a]:transition-colors shadow [&>a]:bg-ds-bg-subtle [&>a]:text-xs [&>svg]:w-4 [&>svg]:h-4 relative -top-[2px] citation-shimmer"><a href="https://stackoverflow.com/questions/201183/how-can-i-determine-equality-for-two-javascript-objects" target="_blank" title="How can I determine equality for two JavaScript objects?">1</a></sup><sup data-citation="5" className="inline select-none [&>a]:rounded-2xl [&>a]:border [&>a]:px-1.5 [&>a]:py-0.5 [&>a]:transition-colors shadow [&>a]:bg-ds-bg-subtle [&>a]:text-xs [&>svg]:w-4 [&>svg]:h-4 relative -top-[2px] citation-shimmer"><a href="https://www.geeksforgeeks.org/check-if-a-variable-is-a-string-using-javascript/" target="_blank" title="Check if a variable is a string using JavaScript">5</a></sup>

  const firstChar = nextWord.trim().toLowerCase()[0];
  const exceptions = {
    vowelSounds: [
      "honest",
      "honor",
      "hour",
      "heir",
      "herb",
      "uniform",
      "university",
      "utopia",
      "xylophone",
      "xenophobia",
      "x-ray",
    ],
    consonantSounds: [
      "unique",
      "user",
      "uber",
      "eucalyptus",
      "one",
      "once",
      "ouija",
    ],
  };

  // Handle empty string or pure whitespace
  if (!firstChar) return "a";

  // Rule 1: Always 'an' before silent 'h' words
  if (
    exceptions.vowelSounds.some((word) =>
      nextWord.toLowerCase().startsWith(word)
    )
  ) {
    return "an";
  }

  // Rule 2: Handle 'u' and 'eu' sounding like 'you'
  if (
    exceptions.consonantSounds.some((word) =>
      nextWord.toLowerCase().startsWith(word)
    )
  ) {
    return "a";
  }

  // Rule 3: Check for numbers/acronyms (pronounced as letters/numbers)
  if (!isNaN(Number(firstChar))) {
    const numberSound: { [key: string]: string } = {
      "8": "an", // 'eight' starts with vowel sound
      "1": "a", // 'one' starts with 'w' sound (consonant), also handles '11'
    };
    return numberSound[firstChar] || "a";
  }

  // Rule 4: Standard vowel check
  const vowels = new Set(["a", "e", "i", "o", "u"]);
  return vowels.has(firstChar) ? "an" : "a";
}

export function useHandleGoogleDrive() {
  const handleGoogleDrive = (url: string): string => {
    if (!url) return "";

    // Check if the URL is a Google Drive link
    const googleDriveRegex =
      /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
    const match = url.match(googleDriveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }

    // If not a Google Drive link, return the original URL
    return url;
  };

  return { handleGoogleDrive };
}
