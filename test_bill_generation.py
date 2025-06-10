import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.finance.service import billing_service
from app.core.config import settings
from app.core.context import current_user_id

# 创建数据库连接
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # 设置当前用户ID（假设用户ID为1）
    current_user_id.set(1)
    
    # 测试为病历ID=2生成账单（不包含诊疗费）
    print('正在为病历ID=2生成账单...')
    result = billing_service.generate_bill_for_record(
        db=db, 
        medical_record_id=2, 
        include_consultation_fee=False
    )
    print(f'成功生成账单，账单ID: {result.id}, 总金额: {result.total_amount}')
    
except Exception as e:
    print(f'账单生成失败: {str(e)}')
    import traceback
    traceback.print_exc()
    
finally:
    db.close()