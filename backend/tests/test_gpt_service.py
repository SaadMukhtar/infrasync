from services.gpt import GPTService


class TestGPTService:
    def test_constructor_runs(self):
        service = GPTService()
        assert service is not None
