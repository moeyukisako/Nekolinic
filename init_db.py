from app.core.database import Base, engine

def init_db():
    print("正在导入所有功能模块的模型以完成向 Base 的注册...")
    
    # 导入所有模型模块，触发模型注册
    # 目前各模块的 models.py 尚未创建，所以此处暂时注释
    # from app.user import models
    # from app.clinic import models  
    # from app.patient import models
    # from app.pharmacy import models
    # from app.finance import models
    
    print("模型注册完成。")
    
    print("准备在数据库中创建所有表...")
    # create_all 会根据依赖关系按正确顺序创建表
    Base.metadata.create_all(bind=engine)
    print("所有表已成功创建！")


if __name__ == "__main__":
    init_db() 