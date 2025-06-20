import pytest
from services import user


class TestUserService:
    def test_encrypt_token_success(self, fernet_key):
        test_token = "test-github-token"
        with pytest.MonkeyPatch.context() as m:
            m.setenv("FERNET_KEY", fernet_key.decode())
            encrypted = user.encrypt_token(test_token)
            assert encrypted != test_token
            assert isinstance(encrypted, str)
            assert len(encrypted) > 0

    def test_decrypt_token_success(self, fernet_key):
        test_token = "test-github-token"
        with pytest.MonkeyPatch.context() as m:
            m.setenv("FERNET_KEY", fernet_key.decode())
            encrypted = user.encrypt_token(test_token)
            decrypted = user.decrypt_token(encrypted)
            assert decrypted == test_token
