import pytest
from app.core.context import current_user_id, ContextVar

def test_context_var_set_get():
    """测试上下文变量的设置和获取功能"""
    # 创建一个新的上下文变量
    test_var = ContextVar("test_var")
    
    # 设置值并验证
    token = test_var.set(123)
    assert test_var.get() == 123
    
    # 测试重置功能
    test_var.reset(token)
    
    # 注意：reset后不能直接调用get()，会抛出LookupError
    # 此时应该重新设置默认值或检查存在性
    try:
        test_var.get()
        pytest.fail("应该抛出LookupError")
    except LookupError:
        pass  # 预期行为

def test_current_user_id_context():
    """测试current_user_id上下文变量"""
    # 保存原始值
    original_value = current_user_id.get()
    
    try:
        # 设置一个测试值
        token = current_user_id.set(999)
        assert current_user_id.get() == 999
        
        # 验证重置功能
        current_user_id.reset(token)
        
        # 检查重置后的值
        # 注意：current_user_id可能有默认值，不一定会抛出异常
        reset_value = current_user_id.get()
        assert reset_value != 999, "重置后的值不应该是测试值"
    finally:
        # 恢复原始值(如果有)
        if original_value is not None:
            current_user_id.set(original_value)

def test_multiple_context_vars():
    """测试多个上下文变量的独立性"""
    var1 = ContextVar("var1")
    var2 = ContextVar("var2")
    
    # 设置不同的值
    token1 = var1.set("value1")
    token2 = var2.set("value2")
    
    # 验证值的独立性
    assert var1.get() == "value1"
    assert var2.get() == "value2"
    
    # 重置一个变量不影响另一个
    var1.reset(token1)
    try:
        var1.get()
        pytest.fail("应该抛出LookupError")
    except LookupError:
        pass  # 预期行为
    
    # 第二个变量不受影响
    assert var2.get() == "value2"
    
    # 清理
    var2.reset(token2)

def test_context_var_isolation():
    """测试不同ContextVar实例的隔离性"""
    # 创建两个同名但不同实例的上下文变量
    var1 = ContextVar("same_name")
    var2 = ContextVar("same_name")
    
    # 设置不同的值
    var1.set("value_for_var1")
    var2.set("value_for_var2")
    
    # 验证它们是独立的实例
    assert var1.get() == "value_for_var1"
    assert var2.get() == "value_for_var2"
    assert var1 is not var2 