from services.monitor import MonitorService


class TestMonitorService:
    def test_init_with_valid_config(self, mock_env_vars):
        service = MonitorService()
        assert service.client is not None
        assert service.github_service is not None
