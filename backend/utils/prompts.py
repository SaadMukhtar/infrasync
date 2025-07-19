def build_summary_prompt(grouped_highlights: str) -> str:

    return f"""
You are an assistant completing the Highlights section of a Slack digest summarizing GitHub activity.

Your Job and rules:
- Improve the commit messages
- Keep tone neutral, punchy, and dev-pm-friendly. 
- No filler words, no motivational language. 
– Uses dashes and group bullets by type if possible (🐛 Bugfixes, ✨ Features, ⚡️ Performance, 📝 Docs, ♻️ Refactors)
– Be concise, no full sentences or summaries
– Don't make up anything not provided, try to use the most important commits

Example highlights output format:
*🐛 Bugfixes:*
     • Resolved admin role mismatch

*✨ Features:*
     • Enabled 2FA and dark mode settings

*♻️ Refactors:*
     • Modularized auth and simplified queries

*📝 Docs:*
     • Improved README and contribution guide

*⚡️ Performance:*
     • Optimized image rendering


Data to use to create highlights:
{grouped_highlights}

Your output:
"""
