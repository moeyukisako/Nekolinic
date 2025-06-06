from datetime import timedelta
from jose import jwt
import pytest
from app.core import security
from app.core.config import settings

def test_create_access_token():
    # 测试 Token 能否被正确创建和解码
    data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=15)
    token = security.create_access_token(data, expires_delta=expires_delta)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload.get("sub") == "testuser"
    assert "exp" in payload  # 确保过期时间存在

def test_create_access_token_default_expiry():
    # 测试不提供expires_delta时，是否使用默认的过期时间
    data = {"sub": "testuser"}
    token = security.create_access_token(data)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload.get("sub") == "testuser"
    assert "exp" in payload 