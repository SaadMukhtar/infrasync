import httpx
import os
from typing import Dict, List
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class GitHubService:
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Infrasync/1.0"
        }
        
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"
    
    def _extract_repo_info(self, repo_url: str) -> tuple[str, str]:
        """Extract owner and repo name from GitHub URL."""
        # Handle various GitHub URL formats
        url_parts = repo_url.rstrip('/').split('/')
        if 'github.com' in url_parts:
            github_index = url_parts.index('github.com')
            if len(url_parts) >= github_index + 3:
                owner = url_parts[github_index + 1]
                repo = url_parts[github_index + 2]
                return owner, repo
        
        raise ValueError(f"Invalid GitHub repository URL: {repo_url}")
    
    async def fetch_repository_data(self, repo_url: str) -> Dict:
        """Fetch recent activity data from a GitHub repository."""
        try:
            owner, repo = self._extract_repo_info(repo_url)
            
            async with httpx.AsyncClient() as client:
                # Fetch repository info
                repo_response = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}",
                    headers=self.headers
                )
                repo_response.raise_for_status()
                repo_data = repo_response.json()
                
                # Calculate date range (last 7 days)
                since_date = datetime.now(timezone.utc) - timedelta(days=1)
                since_date_str = since_date.isoformat()
                pr_opened = await self.fetch_search_results(f"repo:{owner}/{repo} type:pr created:>{since_date_str}")
                pr_closed = await self.fetch_search_results(f"repo:{owner}/{repo} type:pr closed:>{since_date_str}")
                issues_opened = await self.fetch_search_results(f"repo:{owner}/{repo} type:issue created:>{since_date_str}")
                issues_closed = await self.fetch_search_results(f"repo:{owner}/{repo} type:issue closed:>{since_date_str}")
                
                # Fetch recent commits
                commits_response = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/commits",
                    headers=self.headers,
                    params={"since": since_date_str, "per_page": 100}
                )
                commits_response.raise_for_status()
                all_commits = commits_response.json()

                grouped_commits = self.group_commit_messages(all_commits)

                logger.info(
                    f"Fetched repo data for {repo}: "
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
                        "issues_closed": len(issues_closed)
                    },
                    "grouped_commits": grouped_commits
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"GitHub API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to fetch repository data: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching repository data: {str(e)}")
            raise Exception(f"Failed to fetch repository data: {str(e)}")

    async def fetch_search_results(self, query: str) -> List[Dict]:
        url = f"{self.base_url}/search/issues"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                params={"q": query, "per_page": 100}
            )
            response.raise_for_status()
            return response.json()["items"]

    def group_commit_messages(self, commits: List) -> Dict:
        grouped = {
            "bugfix": [],
            "feature": [],
            "perf": [],
            "docs": [],
            "refactor": [],
            "other": []
        }

        for i, commit in enumerate(commits):
            try:
                msg = commit['commit']['message']
                summary = msg.split("\n")[0][:100].lower()

                matched = False
                if "fix" in summary or "bug" in summary:
                    grouped["bugfix"].append(summary)
                    matched = True
                if "feat" in summary or "feature" in summary:
                    grouped["feature"].append(summary)
                    matched = True
                if "perf" in summary or "speed" in summary:
                    grouped["perf"].append(summary)
                    matched = True
                if "doc" in summary:
                    grouped["docs"].append(summary)
                    matched = True
                if "refactor" in summary:
                    grouped["refactor"].append(summary)
                    matched = True
                if not matched:
                    grouped["other"].append(summary)

            except Exception as e:
                logger.warning(f"[commit {i}] Skipped due to error: {e}")

        logger.info("(github/group_commit_messages): Commit grouping complete.")
        return grouped
