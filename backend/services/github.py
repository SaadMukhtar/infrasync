import httpx
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class GitHubService:
    def __init__(self) -> None:
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Infrasync/1.0",
        }

        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"

    async def fetch_repository_data(self, repo: str) -> Dict[str, Any]:
        """Fetch recent activity data from a GitHub repository."""
        try:
            try:
                owner, repo_name = repo.strip().split("/")
            except ValueError:
                raise ValueError(
                    f"Invalid repo format: '{repo}'. Expected format: 'owner/repo'"
                )

            async with httpx.AsyncClient() as client:
                # Fetch repository info
                repo_response = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo_name}", headers=self.headers
                )
                repo_response.raise_for_status()
                repo_data = repo_response.json()

                # Calculate date range (last 7 days)
                since_date = datetime.now(timezone.utc) - timedelta(days=1)
                since_date_str = since_date.isoformat()
                pr_opened = await self.fetch_search_results(
                    f"repo:{owner}/{repo_name} type:pr created:>{since_date_str}"
                )
                pr_closed = await self.fetch_search_results(
                    f"repo:{owner}/{repo_name} type:pr closed:>{since_date_str}"
                )
                issues_opened = await self.fetch_search_results(
                    f"repo:{owner}/{repo_name} type:issue created:>{since_date_str}"
                )
                issues_closed = await self.fetch_search_results(
                    f"repo:{owner}/{repo_name} type:issue closed:>{since_date_str}"
                )

                # Fetch recent commits
                commits_response = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo_name}/commits",
                    headers=self.headers,
                    params={"since": since_date_str, "per_page": 100},
                )
                commits_response.raise_for_status()
                all_commits = commits_response.json()

                grouped_commits = self.group_commit_messages(all_commits)

                logger.info(
                    f"Fetched repo data for {repo_name}: "
                    f"{len(all_commits)} commits, "
                    f"{len(pr_opened) + len(pr_closed)} PRs, "
                    f"{len(issues_opened) + len(issues_closed)} issues."
                )

                return {
                    "repository": {
                        "full_name": repo_data["full_name"],
                    },
                    "summary_counts": {
                        "commits": len(all_commits),
                        "prs_opened": len(pr_opened),
                        "prs_closed": len(pr_closed),
                        "issues_opened": len(issues_opened),
                        "issues_closed": len(issues_closed),
                    },
                    "grouped_commits": grouped_commits,
                }

        except httpx.HTTPStatusError as e:
            logger.error(
                f"GitHub API error: {e.response.status_code} - {e.response.text}"
            )
            raise Exception(
                f"Failed to fetch repository data: {e.response.status_code}"
            )
        except Exception as e:
            logger.error(f"Error fetching repository data: {str(e)}")
            raise Exception(f"Failed to fetch repository data: {str(e)}")

    async def fetch_search_results(self, query: str) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/search/issues"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, headers=self.headers, params={"q": query, "per_page": 100}
            )
            response.raise_for_status()
            items = response.json()["items"]
            return list(items) if isinstance(items, list) else []

    def group_commit_messages(self, commits: List[Any]) -> Dict[str, List[str]]:
        grouped: Dict[str, List[str]] = {
            "bugfix": [],
            "feature": [],
            "perf": [],
            "docs": [],
            "refactor": [],
            "other": [],
        }

        for i, commit in enumerate(commits):
            try:
                msg = commit["commit"]["message"]
                # Skip empty or very short commit messages
                if not msg or len(msg.strip()) < 3:
                    continue

                summary = msg.split("\n")[0][:100].strip()

                # Skip commits that are just punctuation or very short
                if len(summary) < 5 or summary in [
                    ".",
                    "!",
                    "?",
                    "...",
                    "update",
                    "fix",
                    "wip",
                ]:
                    continue

                matched = False
                if "fix" in summary.lower() or "bug" in summary.lower():
                    grouped["bugfix"].append(summary)
                    matched = True
                if "feat" in summary.lower() or "feature" in summary.lower():
                    grouped["feature"].append(summary)
                    matched = True
                if "perf" in summary.lower() or "speed" in summary.lower():
                    grouped["perf"].append(summary)
                    matched = True
                if "doc" in summary.lower():
                    grouped["docs"].append(summary)
                    matched = True
                if "refactor" in summary.lower():
                    grouped["refactor"].append(summary)
                    matched = True
                if not matched:
                    grouped["other"].append(summary)

            except Exception as e:
                logger.warning(f"[commit {i}] Skipped due to error: {e}")

        # Filter out empty categories
        filtered_grouped: Dict[str, List[str]] = {}
        for category, commits in grouped.items():
            if commits:  # Only include categories with actual commits
                filtered_grouped[category] = commits

        logger.info(
            f"(github/group_commit_messages): Commit grouping complete. Categories: {list(filtered_grouped.keys())}"
        )
        return filtered_grouped

    async def is_repo_private(self, repo: str, github_token: str) -> bool:
        owner, repo_name = repo.strip().split("/")
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Infrasync/1.0",
            "Authorization": f"token {github_token}",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo_name}", headers=headers
            )
            resp.raise_for_status()
            repo_data = resp.json()
            return bool(repo_data.get("private", False))
