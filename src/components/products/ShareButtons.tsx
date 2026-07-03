"use client";

interface ShareButtonsProps {
  url: string;
  title: string;
}

const ICON: Record<string, string> = {
  facebook:
    "M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z",
  twitter:
    "M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z",
  email:
    "M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z",
  linkedin:
    "M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z",
};

const VIEWBOX: Record<string, string> = {
  facebook: "0 0 320 512",
  twitter: "0 0 512 512",
  email: "0 0 24 24",
  linkedin: "0 0 448 512",
};

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const enc = encodeURIComponent;
  const links = [
    { label: "facebook", color: "#3b5998", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "twitter", color: "#00acee", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { label: "email", color: "#D44638", href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
    { label: "linkedin", color: "#0e76a8", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];

  return (
    <div className="flex items-center">
      <h3 className="font-semibold whitespace-nowrap mr-2">Share:</h3>
      <div className="flex items-center justify-start gap-2 py-3">
        {links.map(({ label, color, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
            className="rounded-full w-[30px] h-[30px] flex justify-center items-center bg-surface-50 hover:bg-brand-50 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox={VIEWBOX[label]}
              fill={color}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={ICON[label]} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
