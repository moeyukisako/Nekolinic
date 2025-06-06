from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm import DeclarativeBase
from functools import wraps

from .config import settings

# 配置数据库连接，从配置文件加载参数
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # 仅适用于SQLite
)

# 创建会话本地对象
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建作为所有模型基类的Base类
class Base(DeclarativeBase):
    pass

# 依赖函数，用于注入数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 事务装饰器
def transactional(func):
    """
    事务装饰器，确保一个服务方法要么完全成功，要么完全失败
    用法示例：
    @transactional
    def my_service_method(self, db: Session, ...):
        # 执行多个数据库操作
        # 不需要手动commit或rollback
    """
    @wraps(func)
    def wrapper(self, db: Session, *args, **kwargs):
        try:
            result = func(self, db, *args, **kwargs)
            db.commit()
            return result
        except Exception as e:
            db.rollback()
            raise e
    return wrapper
