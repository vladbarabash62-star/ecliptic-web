import Link from "next/link";

type LegalSection = {
  title: string;
  text: string;
};

type LegalPageProps = {
  title: string;
  lead: string;
  sections: LegalSection[];
};

export default function LegalPage({ title, lead, sections }: LegalPageProps) {
  return (
    <main className="product-page-enter relative w-full flex-1 overflow-x-hidden bg-transparent px-4 py-8 text-white sm:py-12">
      <article className="mx-auto w-full max-w-[860px] rounded-3xl border border-white/10 bg-[#0a0d14]/84 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-9">
        <Link
          href="/"
          className="inline-flex rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/10 hover:text-white"
        >
          Назад к магазину
        </Link>

        <h1 className="mt-7 text-3xl font-black text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-white/68">{lead}</p>

        <div className="mt-8 grid gap-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/10 bg-[#0f1420]/78 p-4 sm:p-5"
            >
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">
                {section.text}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
