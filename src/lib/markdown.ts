import { marked } from 'marked';

/** Renders Markdown stored in a frontmatter field (e.g. the manifesto's outro). */
export function markdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}
