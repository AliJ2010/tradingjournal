export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/optictrader-logo.png" alt="OpticTrader" className={`${className} object-cover rounded-full`} />;
}
