#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复病历表中display_id为NULL的数据
为所有display_id为NULL的病历生成唯一标识符
"""

import sys
import os
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base
from app.patient.models import MedicalRecord
from app.clinic.models import Doctor, Appointment
from app.user.models import User
from app.core.config import settings

# 创建数据库引擎
engine = create_engine("sqlite:///./clinic.db")

def generate_display_id(record_id: int, record_date: datetime) -> str:
    """
    生成病历显示ID
    格式: MR + 年月日 + 3位序号
    例如: MR20241201001
    """
    date_str = record_date.strftime('%Y%m%d')
    # 使用记录ID作为序号，确保唯一性
    sequence = str(record_id).zfill(3)
    return f"MR{date_str}{sequence}"

def fix_display_id_data():
    """
    修复display_id为NULL的数据
    """
    print("开始修复病历表中display_id为NULL的数据...")
    
    # 创建数据库会话
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 查找所有display_id为NULL的记录
        null_records = db.query(MedicalRecord).filter(
            MedicalRecord.display_id.is_(None)
        ).all()
        
        if not null_records:
            print("✅ 没有发现display_id为NULL的记录，数据完整性良好。")
            return
        
        print(f"🔍 发现 {len(null_records)} 条display_id为NULL的记录，开始修复...")
        
        updated_count = 0
        for record in null_records:
            try:
                # 生成新的display_id
                new_display_id = generate_display_id(record.id, record.record_date)
                
                # 检查是否已存在相同的display_id
                existing = db.query(MedicalRecord).filter(
                    MedicalRecord.display_id == new_display_id,
                    MedicalRecord.id != record.id
                ).first()
                
                # 如果存在冲突，添加额外的序号
                counter = 1
                original_display_id = new_display_id
                while existing:
                    new_display_id = f"{original_display_id}_{counter:02d}"
                    existing = db.query(MedicalRecord).filter(
                        MedicalRecord.display_id == new_display_id,
                        MedicalRecord.id != record.id
                    ).first()
                    counter += 1
                
                # 更新记录
                record.display_id = new_display_id
                updated_count += 1
                
                print(f"  ✓ 记录ID {record.id}: {new_display_id}")
                
            except Exception as e:
                print(f"  ❌ 处理记录ID {record.id} 时出错: {str(e)}")
                continue
        
        # 提交更改
        db.commit()
        print(f"\n✅ 成功修复 {updated_count} 条记录的display_id")
        
        # 验证修复结果
        remaining_null = db.query(MedicalRecord).filter(
            MedicalRecord.display_id.is_(None)
        ).count()
        
        if remaining_null == 0:
            print("🎉 所有display_id为NULL的记录已成功修复！")
        else:
            print(f"⚠️  仍有 {remaining_null} 条记录的display_id为NULL，请检查")
            
    except Exception as e:
        print(f"❌ 修复过程中发生错误: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def check_data_integrity():
    """
    检查数据完整性
    """
    print("\n检查数据完整性...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 统计总记录数
        total_records = db.query(MedicalRecord).count()
        
        # 统计display_id为NULL的记录数
        null_display_id = db.query(MedicalRecord).filter(
            MedicalRecord.display_id.is_(None)
        ).count()
        
        # 统计重复的display_id
        duplicate_query = text("""
            SELECT display_id, COUNT(*) as count 
            FROM medical_records 
            WHERE display_id IS NOT NULL 
            GROUP BY display_id 
            HAVING COUNT(*) > 1
        """)
        
        duplicates = db.execute(duplicate_query).fetchall()
        
        print(f"📊 数据完整性报告:")
        print(f"  - 总病历记录数: {total_records}")
        print(f"  - display_id为NULL的记录数: {null_display_id}")
        print(f"  - 重复的display_id数量: {len(duplicates)}")
        
        if duplicates:
            print("  重复的display_id:")
            for dup in duplicates:
                print(f"    - {dup.display_id}: {dup.count} 条记录")
        
        if null_display_id == 0 and len(duplicates) == 0:
            print("✅ 数据完整性检查通过！")
        else:
            print("⚠️  发现数据完整性问题，建议运行修复脚本")
            
    except Exception as e:
        print(f"❌ 检查数据完整性时发生错误: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("病历display_id数据修复工具")
    print("=" * 60)
    
    # 首先检查数据完整性
    check_data_integrity()
    
    # 询问是否执行修复
    if input("\n是否执行数据修复？(y/N): ").lower() in ['y', 'yes']:
        fix_display_id_data()
        
        # 修复后再次检查
        check_data_integrity()
    else:
        print("取消修复操作。")
    
    print("\n脚本执行完成。")