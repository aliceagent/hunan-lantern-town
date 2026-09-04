import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black text-center text-zinc-100">
      <div>
        <h1 className="text-4xl font-semibold tracking-wide">Lantern River Town</h1>
        <p className="mt-2 text-2xl text-zinc-400">河灯小镇</p>
      </div>
      <Link
        href="/play"
        className="flex w-full min-h-[48px] items-center justify-center rounded-full border border-amber-400/60 px-8 py-4 text-lg text-amber-200 transition-colors hover:bg-amber-400/10 sm:w-auto"
      >
        Begin
      </Link>
    </main>
  );
}
