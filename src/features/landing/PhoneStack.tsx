import Image from "next/image";
import { Bookmark, Bubble, Dots, Heart, Send } from "@/components/insta-icons";

type Post = {
  src: string;
  user: string;
  initial: string;
  location: string;
  caption: string;
  amount: string;
  category: string;
  likes: number;
  age: string;
  rot: number;
  delay: number;
};

const posts: Post[] = [
  {
    src: "/assets/landing/cafe-02.jpg",
    user: "nora_cafe",
    initial: "N",
    location: "성수동 · Coffee",
    caption: "출근 전 단골집 라떼 한 잔.",
    amount: "₩6,500",
    category: "Coffee",
    likes: 1247,
    age: "2h",
    rot: -8,
    delay: 0,
  },
  {
    src: "/assets/landing/cafe-04.jpg",
    user: "daily_grind",
    initial: "S",
    location: "을지로 · Brunch",
    caption: "월요일 점심은 가볍게.",
    amount: "₩14,800",
    category: "Brunch",
    likes: 832,
    age: "5h",
    rot: 0,
    delay: 220,
  },
  {
    src: "/assets/landing/cafe-06.jpg",
    user: "brewmood",
    initial: "B",
    location: "합정 · Beans",
    caption: "이번 주 원두 입고.",
    amount: "₩22,000",
    category: "Beans",
    likes: 2104,
    age: "1d",
    rot: 7,
    delay: 380,
  },
];

function PostCard({ post }: { post: Post }) {
  return (
    <div
      className="phone-rise w-[230px] sm:w-[250px] origin-bottom"
      style={
        {
          "--rot": `${post.rot}deg`,
          animationDelay: `${post.delay}ms`,
        } as React.CSSProperties
      }
    >
      <article className="overflow-hidden rounded-[24px] bg-[color:var(--paper)] shadow-[0_24px_50px_-22px_rgba(20,12,30,0.45),0_6px_18px_-10px_rgba(20,12,30,0.2)] ring-1 ring-black/5">
        <header className="flex items-center gap-2 px-3 py-2.5">
          <span className="bg-pay-gradient inline-flex h-8 w-8 items-center justify-center rounded-full p-[2px]">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[color:var(--paper)] text-[10.5px] font-semibold tracking-wide">
              {post.initial}
            </span>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-semibold">{post.user}</span>
            <span className="text-[10px] text-[color:var(--ink-soft)]">
              {post.location}
            </span>
          </div>
          <Dots className="ml-auto h-4 w-4 text-[color:var(--ink-soft)]" />
        </header>

        <div className="relative aspect-square w-full">
          <Image
            src={post.src}
            alt=""
            fill
            sizes="250px"
            className="object-cover"
            priority
          />
          <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full bg-pay px-2.5 py-1 font-mono text-[10.5px] font-semibold tabular-nums text-[color:var(--pay-on)] shadow-[0_4px_12px_-4px_rgba(3,199,90,0.55)]">
            {post.amount}
          </span>
          <span className="absolute left-2.5 bottom-2.5 inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-[color:var(--pay-forest)] ring-1 ring-[color:var(--pay)]/25 backdrop-blur-sm">
            {post.category}
          </span>
        </div>

        <footer className="flex flex-col gap-1.5 px-3 pb-3 pt-2.5">
          <div className="flex items-center gap-3.5 text-[color:var(--foreground)]">
            <Heart className="h-[20px] w-[20px]" />
            <Bubble className="h-[20px] w-[20px]" />
            <Send className="h-[20px] w-[20px]" />
            <Bookmark className="ml-auto h-[20px] w-[20px]" />
          </div>
          <p className="text-[11.5px] font-semibold">
            {post.likes.toLocaleString()} likes
          </p>
          <p className="text-[11.5px] leading-snug">
            <span className="font-semibold">{post.user}</span>{" "}
            <span className="text-[color:var(--foreground)]/85">
              {post.caption}
            </span>
          </p>
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
            {post.age} ago
          </p>
        </footer>
      </article>
    </div>
  );
}

export function PhoneStack() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div
        aria-hidden
        className="bg-pay-gradient pointer-events-none absolute inset-4 -z-10 rounded-[40px] opacity-20 blur-3xl"
      />

      {/* lg: 3-card fan-out, absolute-positioned inside fixed-width box */}
      <div className="relative hidden h-[460px] w-full lg:block">
        <div className="absolute bottom-2 left-0 z-10">
          <PostCard post={posts[0]} />
        </div>
        <div className="absolute bottom-2 right-0 z-20">
          <PostCard post={posts[2]} />
        </div>
        <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
          <PostCard post={posts[1]} />
        </div>
      </div>

      {/* mobile / tablet: single hero card */}
      <div className="flex w-full justify-center py-4 lg:hidden">
        <PostCard post={posts[1]} />
      </div>
    </div>
  );
}
