import requests
import sys
import json

# 测试JSON登录API
def test_json_login():
    url = "http://localhost:8000/api/v1/users/login/json"
    
    # 准备JSON数据
    data = {
        "username": "admin",
        "password": "password"
    }
    
    # 发送POST请求
    try:
        print(f"正在测试JSON登录API: {url}")
        print(f"使用数据: {data}")
        
        response = requests.post(
            url,
            json=data,
            headers={
                "Content-Type": "application/json"
            }
        )
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应头: {response.headers}")
        
        if response.ok:
            print(f"登录成功: {response.json()}")
            return True
        else:
            try:
                print(f"登录失败: {response.json()}")
            except:
                print(f"登录失败: {response.text}")
            return False
    except Exception as e:
        print(f"请求发生错误: {e}")
        return False

if __name__ == "__main__":
    success = test_json_login()
    sys.exit(0 if success else 1) 