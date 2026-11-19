import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/**
 * Markdown rendering for the Profile Detail text, styled with the
 * app tokens. react-markdown never renders raw HTML, so user text
 * cannot inject markup; links open in a new tab. remark-breaks
 * makes a single Enter a visible line break, the way GitHub
 * renders profile text and the way people expect a textarea to
 * behave.
 */
export function ProfileMarkdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[22px] font-semibold leading-snug">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold leading-snug">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold leading-snug">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold">{children}</h4>
          ),
          p: ({ children }) => <p>{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent pl-3 italic text-muted">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded-sm bg-surface px-1 py-0.5 font-mono text-[13px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">
              {children}
            </pre>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ""} className="max-w-full rounded-lg" />
          ),
          hr: () => <hr className="border-line" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-line px-2 py-1 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-line px-2 py-1">{children}</td>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
