from services.digest import DigestService


class TestDigestService:
    def test_init_with_valid_config(self, mock_env_vars):
        service = DigestService()
        assert service.client is not None
