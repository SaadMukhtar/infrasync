from services.github import GitHubService


class TestGitHubService:
    """Test cases for GitHubService."""

    def test_init_with_token(self):
        """Test GitHubService initialization with token."""
        service = GitHubService("test-token")
        assert service.github_token == "test-token"
        assert "Authorization" in service.headers
        assert service.headers["Authorization"] == "token test-token"

    def test_init_without_token(self):
        """Test GitHubService initialization without token."""
        service = GitHubService()
        assert service.github_token is None or isinstance(service.github_token, str)

    def test_group_commit_messages(self):
        """Test commit message grouping."""
        service = GitHubService()

        commits = [
            {"commit": {"message": "feat: add new feature"}},
            {"commit": {"message": "fix: bug fix"}},
            {"commit": {"message": "docs: update README"}},
            {"commit": {"message": "refactor: clean up code"}},
            {"commit": {"message": "perf: optimize performance"}},
            {"commit": {"message": "chore: update dependencies"}},
        ]

        result = service.group_commit_messages(commits)

        assert "feature" in result
        assert "bugfix" in result
        assert "docs" in result
        assert "refactor" in result
        assert "perf" in result
        assert "other" in result

        assert len(result["feature"]) == 1
        assert len(result["bugfix"]) == 1
        assert len(result["docs"]) == 1
        assert len(result["refactor"]) == 1
        assert len(result["perf"]) == 1
        assert len(result["other"]) == 1

    def test_group_commit_messages_empty(self):
        """Test commit message grouping with empty list."""
        service = GitHubService()
        result = service.group_commit_messages([])

        assert result == {}  # Match the actual backend logic output

    def test_group_commit_messages_unknown_type(self):
        """Test commit message grouping with unknown commit type."""
        service = GitHubService()

        commits = [
            {"commit": {"message": "unknown: some message"}},
        ]

        result = service.group_commit_messages(commits)

        assert len(result["other"]) == 1
        assert result["other"][0] == "unknown: some message"
