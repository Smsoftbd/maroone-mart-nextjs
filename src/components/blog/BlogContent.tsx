interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <div
      className="prose-content text-[var(--color-text-secondary)] max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
