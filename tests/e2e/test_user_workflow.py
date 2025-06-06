import pytest
from fastapi import status

def test_user_registration_workflow(client):
    """测试用户注册工作流程"""
    # 1. 创建新用户
    user_data = {
        "username": "e2euser",
        "email": "e2e@example.com",
        "password": "e2epass123",
        "full_name": "E2E Test User",
        "role": "user"
    }
    
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_200_OK
    user_id = response.json()["id"]
    
    # 2. 尝试创建同名用户（应该失败）
    duplicate_user = {
        "username": "e2euser",
        "email": "another@example.com",
        "password": "password123",
        "role": "user"
    }
    
    response = client.post("/api/v1/users/", json=duplicate_user)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    # 3. 尝试创建同邮箱用户（应该失败）
    duplicate_email = {
        "username": "anothername",
        "email": "e2e@example.com",
        "password": "password123",
        "role": "user"
    }
    
    response = client.post("/api/v1/users/", json=duplicate_email)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    # 注意：由于尚未实现登录和用户管理API，这里暂时无法测试更多工作流程
    # 后续可以添加：登录、查看用户信息、更新用户、删除用户等操作 