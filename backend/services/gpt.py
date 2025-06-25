import os
import logging
from openai import AsyncOpenAI
from typing import Dict
from utils.prompts import build_summary_prompt

logger = logging.getLogger(__name__)

 
class GPTService:
    def __init__(self):
        self.use_openai = os.getenv("USE_OPENAI", "false").lower() in ["true", "1", "yes", "y"]
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "400"))

        if self.use_openai:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required when USE_OPENAI is true.")
            self.client = AsyncOpenAI(api_key=api_key)
        else:
            logger.info("USE_OPENAI is false — GPT summaries will be skipped.")
    
    async def generate_digest_summary(
        self,
        summary_counts: Dict,
        grouped_commits: Dict,
        repo_name: str,
    ) -> str:
        """Generate a concise summary of repository activity using GPT."""
        try:
            lines = []
            commit_categories = {
                "bugfix": "🐛 Bugfixes:",
                "refactor": "♻️ Refactors:",
                "feature": "✨ Features:",
                "docs": "📝 Docs:",
                "perf": "⚡️ Performance:"
            }

            for category, header in commit_categories.items():
                commits = grouped_commits.get(category, [])
                if commits:
                    lines.append(header)
                    lines.extend(f"- {m}" for m in commits[:5])

            grouped_highlights = "\n".join(lines)

            if self.use_openai:
                prompt = build_summary_prompt(grouped_highlights)
                logger.info(f"Generated prompt for {repo_name} (first 100 chars): {prompt[:100]}")

                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that creates concise summaries of GitHub repository activity."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=self.max_tokens,
                    temperature=0.7
                )
                summary_highlights = response.choices[0].message.content.strip()
            else:
                logger.info("Using raw grouped highlights (OpenAI disabled).")
                summary_highlights = grouped_highlights

            # Build tagged commits line dynamically
            logger.info(grouped_commits)
            logger.info(grouped_highlights)
            tagged_parts = [
                f"{len(grouped_commits.get(cat, []))} {cat}"
                for cat in commit_categories.keys()
                if grouped_commits.get(cat)
            ]
            tagged_line = f"🚀 Tagged Commits: {', '.join(tagged_parts)}" if tagged_parts else ""

            summary = f"""
🔀 {summary_counts.get('prs_opened', 0)} PRs opened, {summary_counts.get('prs_closed', 0)} closed
✨ {summary_counts.get('issues_opened', 0)} issues opened, {summary_counts.get('issues_closed', 0)} closed
{tagged_line}

🔥 Highlights:

```
{summary_highlights}
``` 
"""

            return summary

        except Exception as e:
            logger.error(f"Error generating digest summary for {repo_name}: {e}")
            raise Exception(f"Failed to generate summary: {e}")