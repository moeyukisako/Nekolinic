"""
测试优化后的药局模块功能
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("Python路径:", sys.path)
print("当前目录:", os.getcwd())
print("尝试导入模块...")

try:
    from app.pharmacy import models, schemas, service
    print("成功导入pharmacy模块")
except Exception as e:
    print(f"导入pharmacy模块失败: {e}")
    
try:
    from app.core.exceptions import AuthenticationException, ValidationException, InsufficientStockException
    print("成功导入exceptions模块")
except Exception as e:
    print(f"导入exceptions模块失败: {e}")

try:
    from unittest import mock
    import pytest
    from datetime import datetime, UTC
    print("成功导入其他依赖")
except Exception as e:
    print(f"导入其他依赖失败: {e}")

# 获取app.core.context.current_user_id的实际实现
try:
    from app.core import context
    print(f"current_user_id类型: {type(context.current_user_id)}")
except Exception as e:
    print(f"导入context模块失败: {e}")

# 直接检查优化后的代码逻辑
def test_authentication_check():
    """测试用户认证检查逻辑"""
    print("检查service.py文件中对current_user_id.get()返回None的处理...")
    
    # 检查service.py文件中的代码
    import re
    with open('app/pharmacy/service.py', 'r', encoding='utf-8') as f:
        service_code = f.read()
    
    # 检查是否存在类似 "if user_id is None: raise AuthenticationException" 的代码
    auth_check_pattern = r"user_id\s*=\s*current_user_id\.get\(\)(.*?)if\s+user_id\s+is\s+None:(.*?)raise\s+AuthenticationException"
    matches = re.findall(auth_check_pattern, service_code, re.DOTALL)
    
    if matches:
        print(f"找到 {len(matches)} 处认证检查代码")
        print("通过：用户ID验证逻辑正确实现")
        assert True
    else:
        print("失败：未找到预期的用户ID验证逻辑")
        assert False, "未找到预期的用户ID验证逻辑"

def test_datetime_usage():
    """测试datetime.now(UTC)的使用"""
    print("检查service.py文件中是否使用了datetime.now(UTC)...")
    
    # 检查service.py文件中的代码
    import re
    with open('app/pharmacy/service.py', 'r', encoding='utf-8') as f:
        service_code = f.read()
    
    # 检查是否存在 datetime.now(UTC) 的使用
    utc_datetime_pattern = r"datetime\.now\(UTC\)"
    matches = re.findall(utc_datetime_pattern, service_code)
    
    if matches:
        print(f"找到 {len(matches)} 处datetime.now(UTC)的使用")
        print("通过：正确使用datetime.now(UTC)")
        assert True
    else:
        print("失败：未找到datetime.now(UTC)的使用")
        assert False, "未找到datetime.now(UTC)的使用"

def test_validation_logic():
    """测试验证逻辑"""
    print("检查service.py文件中的数据验证逻辑...")
    
    # 检查service.py文件中的代码
    import re
    with open('app/pharmacy/service.py', 'r', encoding='utf-8') as f:
        service_code = f.read()
    
    # 检查入库数量验证
    quantity_check_pattern = r"if\s+quantity\s*<=\s*0:(.*?)raise\s+ValidationException"
    matches = re.findall(quantity_check_pattern, service_code, re.DOTALL)
    
    if matches:
        print("找到入库数量必须为正数的验证逻辑")
        print("通过：数据验证逻辑正确实现")
        assert True
    else:
        print("失败：未找到预期的数据验证逻辑")
        assert False, "未找到预期的数据验证逻辑"

def test_api_exception_handling():
    """测试API层异常处理的优化"""
    print("检查api.py文件中是否移除了try-except块...")
    
    # 检查api.py文件中的代码
    with open('app/pharmacy/api.py', 'r', encoding='utf-8') as f:
        api_code = f.read()
    
    # 检查是否存在try-except块
    try_except_count = api_code.count("try:")
    
    if try_except_count == 0:
        print("通过：API层已移除try-except块")
        assert True
    else:
        print(f"失败：在API层仍存在 {try_except_count} 个try-except块")
        assert False, f"在API层仍存在 {try_except_count} 个try-except块"

if __name__ == "__main__":
    print("\n=== 测试认证检查逻辑 ===")
    auth_test_result = test_authentication_check()
    
    print("\n=== 测试datetime.now(UTC)使用 ===")
    datetime_test_result = test_datetime_usage()
    
    print("\n=== 测试验证逻辑 ===")
    validation_test_result = test_validation_logic()
    
    print("\n=== 测试API异常处理优化 ===")
    api_test_result = test_api_exception_handling()
    
    print("\n=== 测试结果汇总 ===")
    all_passed = all([auth_test_result, datetime_test_result, validation_test_result, api_test_result])
    
    if all_passed:
        print("✅ 所有测试通过，优化成功实施!")
    else:
        print("❌ 部分测试未通过，请检查优化实施情况。") 