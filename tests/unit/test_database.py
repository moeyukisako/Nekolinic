import pytest
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import Base, engine, get_db, SessionLocal

def test_database_connection():
    """测试数据库连接是否正常工作"""
    try:
        # 尝试执行一个简单的SQL查询
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            row = result.fetchone()
            assert row[0] == 1
    except SQLAlchemyError as e:
        pytest.fail(f"数据库连接失败: {str(e)}")

def test_session_context_manager():
    """测试会话上下文管理器是否正常工作"""
    # 创建一个会话
    db = SessionLocal()
    try:
        # 尝试执行一个简单的查询
        result = db.execute(text("SELECT 1"))
        row = result.fetchone()
        assert row[0] == 1
    finally:
        db.close()

def test_get_db_dependency():
    """测试get_db依赖项是否正常工作"""
    # 获取数据库会话生成器
    db_generator = get_db()
    
    # 获取数据库会话
    db = next(db_generator)
    
    try:
        # 尝试执行一个简单的查询
        result = db.execute(text("SELECT 1"))
        row = result.fetchone()
        assert row[0] == 1
    finally:
        try:
            # 模拟FastAPI的依赖项行为，执行生成器的清理代码
            next(db_generator)
        except StopIteration:
            # 预期的行为
            pass

def test_metadata_tables():
    """测试元数据中是否存在预期的表"""
    # 获取元数据中定义的所有表名
    table_names = Base.metadata.tables.keys()
    
    # 验证基本表是否存在
    essential_tables = {
        "users", "patients", "doctors", "medical_records", 
        "prescriptions", "drugs", "bills", "appointments"
    }
    
    # 确认所有基本表都存在于元数据中
    for table in essential_tables:
        assert table in table_names, f"表 '{table}' 在元数据中不存在" 