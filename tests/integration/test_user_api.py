import pytest
from fastapi import status

def test_create_user(client):
    """测试创建用户API"""
    # 创建用户数据
    user_data = {
        "username": "apiuser",
        "email": "api@example.com",
        "password": "apipass123",
        "full_name": "API User",
        "role": "user"
    }
    
    # 发送POST请求创建用户
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_200_OK
    
    # 验证返回的用户数据
    data = response.json()
    assert data["username"] == user_data["username"]
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert data["role"] == user_data["role"]
    assert "id" in data
    assert "password" not in data  # 确保密码未返回
    assert "hashed_password" not in data  # 确保哈希密码未返回

def test_create_user_duplicate_username(client, test_user):
    """测试创建用户API - 用户名重复"""
    user_data = {
        "username": "testuser",  # 与test_user相同的用户名
        "email": "another@example.com",
        "password": "password123",
        "full_name": "Another User",
        "role": "user"
    }
    
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Username already exists" in response.json()["detail"]

def test_create_user_duplicate_email(client, test_user):
    """测试创建用户API - 邮箱重复"""
    user_data = {
        "username": "newuser",
        "email": "test@example.com",  # 与test_user相同的邮箱
        "password": "password123",
        "full_name": "New User",
        "role": "user"
    }
    
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email already exists" in response.json()["detail"]

def test_create_user_invalid_data(client):
    """测试创建用户API - 无效数据"""
    # 缺少必填字段
    user_data = {
        "username": "incomplete",
        # 缺少email
        "password": "password123"
    }
    
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    # 无效的email格式
    user_data = {
        "username": "invalid",
        "email": "not-an-email",
        "password": "password123"
    }
    
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 