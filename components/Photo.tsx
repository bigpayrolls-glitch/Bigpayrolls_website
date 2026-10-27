import { Camera } from './Icons';

/**
 * A photo spot. Shows the photo when `src` is set (see lib/site.ts → photos),
 * otherwise a soft placeholder describing which photo belongs here.
 */
export default function Photo({
  src,
  alt,
  hint,
  tone = 'warm',
  className = '',
  children,
}: {
  src?: string | null;
  alt: string;
  hint: string;
  tone?: 'warm' | 'stone';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`${/\babsolute\b/.test(className) ? '' : 'relative'} overflow-hidden ${
        src ? 'bg-stone' : tone === 'warm' ? 'ph-warm' : 'ph-stone'
      } ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-5 text-center text-[13px] text-[#8a5a12]">
          <Camera size={32} className="text-[#b9862f]" />
          <span>{hint}</span>
        </div>
      )}
      {children}
    </div>
  );
}
