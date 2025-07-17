import os
import logging
from openai import AsyncOpenAI
from typing import Dict
from utils.prompts import build_summary_prompt

logger = logging.getLogger(__name__)

class GPTService:
    def __init__(self):
        logger.info(dict(os.environ))
        self.OPENAI_ENABLED = os.getenv("OPENAI_ENABLED", "false").lower() in ["true", "1", "yes", "y"]
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "400"))

        if self.OPENAI_ENABLED:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required when OPENAI_ENABLED is true.")
            self.client = AsyncOpenAI(api_key=api_key)
        else:
            logger.info("OPENAI_ENABLED is false — GPT summaries will be skipped.")
    
    async def generate_digest_summary(
        self,
        summary_counts: Dict,
        grouped_commits: Dict,
        repo_name: str,
    ) -> str:
        """Generate a concise summary of repository activity using GPT."""
        try:
            # Check if there's any meaningful activity to summarize
            total_activity = (
                summary_counts.get('prs_opened', 0) +
                summary_counts.get('prs_closed', 0) +
                summary_counts.get('issues_opened', 0) +
                summary_counts.get('issues_closed', 0) +
                sum(len(commits) for commits in grouped_commits.values())
            )
            
            # Check if there are any meaningful commits (not just empty categories)
            meaningful_commits = sum(
                len(commits) for commits in grouped_commits.values() 
                if commits and any(commit.strip() for commit in commits)
            )
            
            logger.info(f"Activity check for {repo_name}: total_activity={total_activity}, meaningful_commits={meaningful_commits}")
            logger.info(f"Grouped commits categories: {list(grouped_commits.keys())}")
            logger.info(f"Summary counts: {summary_counts}")
            
            # If no meaningful activity, return a "no activity" message without calling OpenAI
            if total_activity == 0 or meaningful_commits == 0:
                logger.info(f"No meaningful activity detected for {repo_name}, skipping OpenAI call")
                return f"""  
🔀 {summary_counts.get('prs_opened', 0)} PRs opened, {summary_counts.get('prs_closed', 0)} closed
✨ {summary_counts.get('issues_opened', 0)} issues opened, {summary_counts.get('issues_closed', 0)} closed

*🔥 Highlights:*

    📭 No activity detected in the last 24 hours
"""

            # Build commit highlights only if there are meaningful commits
            lines = []
            commit_categories = {
                "bugfix": "_🐛 Bugfixes:_",
                "refactor": "_♻️ Refactors:_",
                "feature": "_✨ Features:_",
                "docs": "_📝 Docs:_",
                "perf": "_⚡️ Performance:_",
                "other": "_📦 Other Changes:_"
            }

            meaningful_categories = 0
            for category, header in commit_categories.items():
                commits = grouped_commits.get(category, [])
                # Only include categories with actual commit messages
                if commits and any(commit.strip() for commit in commits):
                    meaningful_categories += 1
                    lines.append(header)
                    lines.extend(f"     • {m}" for m in commits[:5] if m.strip())
                    lines.append("")
                    lines.append("")

            # If no meaningful commit categories, don't call OpenAI
            if meaningful_categories == 0:
                logger.info(f"No meaningful commit categories for {repo_name}, skipping OpenAI call")
                return f"""  
🔀 {summary_counts.get('prs_opened', 0)} PRs opened, {summary_counts.get('prs_closed', 0)} closed
✨ {summary_counts.get('issues_opened', 0)} issues opened, {summary_counts.get('issues_closed', 0)} closed

*🔥 Highlights:*

    📭 No activity detected in the last 24 hours
"""

            grouped_highlights = "\n".join(lines)

            if self.OPENAI_ENABLED:
                logger.info(f"Calling OpenAI API for {repo_name} with {meaningful_categories} meaningful categories")
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
                raw_summary = response.choices[0].message.content.strip()
                summary_highlights = "\n".join("    " + line if line.strip() else "" for line in raw_summary.splitlines())
                logger.info(f"OpenAI API call successful for {repo_name}")
            else:
                logger.info(f"Using raw grouped highlights (OpenAI disabled: {os.getenv('OPENAI_ENABLED')}).")
                summary_highlights = grouped_highlights

            # Build tagged commits line dynamically
            tagged_parts = [
                f"{len(grouped_commits.get(cat, []))} {cat}"
                for cat in commit_categories.keys()
                if grouped_commits.get(cat)
            ] 
            logger.info(f"(gpt/generate_digest_summary): tagged_parts: {tagged_parts}")

            summary = f"""  
🔀 {summary_counts.get('prs_opened', 0)} PRs opened, {summary_counts.get('prs_closed', 0)} closed
✨ {summary_counts.get('issues_opened', 0)} issues opened, {summary_counts.get('issues_closed', 0)} closed

*🔥 Highlights:*

{summary_highlights}
"""

            return summary

        except Exception as e:
            logger.error(f"Error generating digest summary for {repo_name}: {e}")
            raise Exception(f"Failed to generate summary: {e}")
