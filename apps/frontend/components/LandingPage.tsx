import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Folder,
  Files,
  LayoutGrid,
  Search,
  ChevronRight,
  HardDrive,
  FileText,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Link2,
  Sun,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/export";

const features = [
  {
    icon: Link2,
    title: "Bring your accounts together",
    description:
      "Connect your Google Drive accounts and keep your cloud storage within reach from one workspace.",
  },
  {
    icon: Folder,
    title: "Less switching. More doing.",
    description:
      "Browse files and folders across your connected drives without juggling browser tabs.",
  },
  {
    icon: HardDrive,
    title: "See the bigger picture",
    description: "Keep track of your connected accounts and storage usage, all in one place.",
  },
];

export default function LandingPage() {
  const authLink = `${BACKEND_URL?.replace(/\/+$/, "") ?? ""}/auth/google`;

  return (
    <div className="min-h-svh overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-5 sm:gap-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
          aria-label="UniCloud home"
        >
          <Image
            src="/favicon.ico"
            alt=""
            width={36}
            height={36}
            className="h-9 w-auto shrink-0 object-contain"
            unoptimized
          />
          UniCloud
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-7">
          <a
            href="#how-it-works"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            How it works
          </a>
          <ThemeToggle />
          <Button asChild variant="outline">
            <a href={authLink}>
              Sign in <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </nav>
      </header>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3"
      >
        Skip to content
      </a>
      <main id="main-content">
        <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-14 sm:px-6 pb-20 pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute -right-40 top-0 z-0 size-162.5 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative">
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" /> A calmer way to manage your
              cloud
            </p>
            <h1 className="max-w-xl text-[clamp(2.5rem,8vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              All your clouds.
              <br />
              <span className="text-primary">One clear space.</span>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-8 text-muted-foreground">
              Your files live in different places. Bring your Google Drive accounts together in one
              simple, organized workspace.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 w-full gap-3 rounded-lg px-4 sm:w-auto sm:px-6"
              >
                <a href={authLink}>
                  <GoogleIcon />
                  Continue with Google
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Take a closer look <ChevronRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Start with your Google account. Connect your drives next.
            </p>
          </div>
          <WorkspacePreview />
        </section>

        <section id="features" className="border-y border-border bg-surface/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  A little less cloud clutter
                </p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Make room for what matters.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                A focused home for your accounts, folders, and files.
              </p>
            </div>
            <div className="grid gap-9 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="border-t border-border pt-6">
                  <Icon className="mb-5 size-6 text-primary" aria-hidden="true" />
                  <h3 className="mb-3 text-lg font-medium tracking-tight">{title}</h3>
                  <p className="max-w-sm text-sm leading-7 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.3fr] lg:px-10 lg:py-24"
        >
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              From scattered to settled
            </p>
            <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Your workspace,
              <br />
              in a few simple steps.
            </h2>
            <Button asChild variant="link" className="mt-5 px-0">
              <a href={authLink}>
                Get started with UniCloud <ArrowRight aria-hidden="true" />
              </a>
            </Button>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {[
              ["01", "Sign in", "Use your Google account to open your UniCloud workspace."],
              ["02", "Connect a drive", "Add your Google Drive accounts from your workspace."],
              [
                "03",
                "Find your flow",
                "Browse your connected drives and keep your files organized.",
              ],
            ].map(([number, title, description]) => (
              <li key={number}>
                <span className="font-mono text-sm text-primary">{number} /</span>
                <h3 className="mb-3 mt-5 font-semibold">{title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-6 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center lg:px-10">
          <p>© {new Date().getFullYear()} UniCloud. All your clouds in one place.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-foreground">
              Terms of service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkspacePreview() {
  return (
    <figure
      className="relative mx-auto w-full min-w-0 max-w-2xl"
      aria-label="Illustrative preview of the UniCloud workspace"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_25px_80px_-25px_var(--ring)]">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="mx-auto pr-6 text-[10px] text-muted-foreground">
            UniCloud / Your workspace
          </span>
        </div>
        <div className="flex min-h-80 sm:min-h-96">
          <div className="hidden w-36 shrink-0 border-r border-border bg-muted/20 p-4 sm:block">
            <div className="mb-7 flex items-center gap-2 text-xs font-semibold">
              <Image
                src="/favicon.ico"
                alt=""
                width={20}
                height={20}
                className="h-5 w-auto object-contain"
                unoptimized
              />
              UniCloud
            </div>
            <div className="space-y-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 rounded-md bg-primary/10 p-2 text-primary">
                <LayoutGrid className="size-3.5" /> Overview
              </div>
              <div className="flex items-center gap-2 px-2">
                <Files className="size-3.5" /> My drives
              </div>
              <div className="pt-7 text-[9px] uppercase tracking-widest">Connected drives</div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500" /> Personal drive
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" /> Work drive
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <div className="mb-7 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">My workspace</span>
              <Sun className="size-4 text-muted-foreground" />
            </div>
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold tracking-tight sm:text-lg">
                  Everything, together.
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  A little more organized. A lot more you.
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-primary p-1.5 text-primary-foreground">
                <Plus className="size-3.5" />
              </span>
            </div>
            <div className="mb-5 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[10px] text-muted-foreground">
              <Search className="size-3" /> Your files and folders
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {["Personal drive", "Work drive"].map((name, i) => (
                <div key={name} className="rounded-lg border border-border p-3">
                  <Folder className={`mb-3 size-6 ${i ? "text-amber-500" : "text-blue-500"}`} />
                  <p className="text-[11px] font-medium">{name}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">Google Drive</p>
                </div>
              ))}
            </div>
            <p className="mb-2 text-[11px] font-medium">A place for every project</p>
            {[
              { icon: FileText, name: "Project notes", type: "Document" },
              { icon: ImageIcon, name: "Brand inspiration", type: "Image" },
            ].map(({ icon: Icon, name, type }) => (
              <div key={name} className="flex items-center gap-2 border-b border-border py-3">
                <Icon className="size-4 text-primary" />
                <span className="flex-1 text-[10px]">{name}</span>
                <span className="hidden text-[9px] text-muted-foreground min-[420px]:block">
                  {type}
                </span>
                <MoreHorizontal className="size-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[10px] tracking-wide text-muted-foreground">
        An illustration of your future workspace. Sample files shown.
      </figcaption>
    </figure>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
