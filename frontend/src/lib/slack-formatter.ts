/**
 * Converts Slack markdown formatting to HTML for display
 * Slack uses mrkdwn format: *bold*, _italic_, `code`, <url|text>, etc.
 */
export function formatSlackToHtml(text: string): string {
  if (!text) return text;

  return (
    text
      // Bold: *text* -> <strong>text</strong>
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")

      // Italic: _text_ -> <em>text</em>
      .replace(/_(.*?)_/g, "<em>$1</em>")

      // Strikethrough: ~text~ -> <del>text</del>
      .replace(/~(.*?)~/g, "<del>$1</del>")

      // Inline code: `code` -> <code>code</code>
      .replace(
        /`(.*?)`/g,
        '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>'
      )

      // Code blocks: ```code``` -> <pre><code>code</code></pre>
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-slate-100 p-3 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>'
      )

      // Links: <url|text> -> <a href="url">text</a>
      .replace(
        /<(https?:\/\/[^|>]+)\|([^>]+)>/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$2</a>'
      )

      // Plain URLs: <url> -> <a href="url">url</a>
      .replace(
        /<(https?:\/\/[^>]+)>/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
      )

      // Convert newlines to <br> tags
      .replace(/\n/g, "<br>")
  );
}

/**
 * Converts Slack markdown to plain text (removes all formatting)
 */
export function formatSlackToText(text: string): string {
  if (!text) return text;

  return (
    text
      // Remove bold, italic, strikethrough markers
      .replace(/[*_~]/g, "")

      // Remove code markers
      .replace(/`/g, "")

      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")

      // Extract text from links: <url|text> -> text
      .replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, "$1")

      // Remove plain URLs: <url> -> url
      .replace(/<(https?:\/\/[^>]+)>/g, "$1")
  );
}
