import sys
import os
os.chdir('c:\\Users\\admin\\Desktop\\Nekolinic')
sys.path.insert(0, '.')

import app
from app.core.database import SessionLocal, engine
from sqlalchemy import text

db = SessionLocal()
try:
    # 检查数据库中的表
    result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
    tables = [row[0] for row in result]
    print('数据库中的表:', tables)
    
    # 检查bills表是否存在
    if 'bills' in tables:
        result = db.execute(text("SELECT COUNT(*) FROM bills"))
        count = result.scalar()
        print(f'bills表中的记录数: {count}')
        
        # 查看前几条记录
        result = db.execute(text("SELECT id, invoice_number, total_amount, status FROM bills LIMIT 5"))
        bills = result.fetchall()
        for bill in bills:
            print(f'账单ID: {bill[0]}, 发票号: {bill[1]}, 金额: {bill[2]}, 状态: {bill[3]}')
    else:
        print('bills表不存在')
        
finally:
    db.close()