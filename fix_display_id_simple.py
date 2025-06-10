#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版本的display_id修复脚本
直接使用SQL语句修复数据，避免模型依赖问题
"""

import sqlite3
from datetime import datetime

def generate_display_id(record_id: int, record_date: str) -> str:
    """
    生成病历显示ID
    格式: MR + 年月日 + 3位序号
    例如: MR20241201001
    """
    # 解析日期字符串
    try:
        date_obj = datetime.fromisoformat(record_date.replace('Z', '+00:00'))
        date_str = date_obj.strftime('%Y%m%d')
    except:
        # 如果日期解析失败，使用当前日期
        date_str = datetime.now().strftime('%Y%m%d')
    
    # 使用记录ID作为序号，确保唯一性
    sequence = str(record_id).zfill(3)
    return f"MR{date_str}{sequence}"

def fix_display_id_data():
    """
    修复display_id为NULL的数据
    """
    print("开始修复病历表中display_id为NULL的数据...")
    
    # 连接数据库
    conn = sqlite3.connect('nekolinic.db')
    cursor = conn.cursor()
    
    try:
        # 查找所有display_id为NULL的记录
        cursor.execute("""
            SELECT id, record_date 
            FROM medical_records 
            WHERE display_id IS NULL
        """)
        
        null_records = cursor.fetchall()
        
        if not null_records:
            print("✅ 没有发现display_id为NULL的记录，数据完整性良好。")
            return
        
        print(f"🔍 发现 {len(null_records)} 条display_id为NULL的记录，开始修复...")
        
        updated_count = 0
        for record_id, record_date in null_records:
            try:
                # 生成新的display_id
                new_display_id = generate_display_id(record_id, record_date)
                
                # 检查是否已存在相同的display_id
                cursor.execute("""
                    SELECT COUNT(*) FROM medical_records 
                    WHERE display_id = ? AND id != ?
                """, (new_display_id, record_id))
                
                existing_count = cursor.fetchone()[0]
                
                # 如果存在冲突，添加额外的序号
                counter = 1
                original_display_id = new_display_id
                while existing_count > 0:
                    new_display_id = f"{original_display_id}_{counter:02d}"
                    cursor.execute("""
                        SELECT COUNT(*) FROM medical_records 
                        WHERE display_id = ? AND id != ?
                    """, (new_display_id, record_id))
                    existing_count = cursor.fetchone()[0]
                    counter += 1
                
                # 更新记录
                cursor.execute("""
                    UPDATE medical_records 
                    SET display_id = ?, updated_at = ? 
                    WHERE id = ?
                """, (new_display_id, datetime.now().isoformat(), record_id))
                
                updated_count += 1
                print(f"✅ 记录ID {record_id} 的display_id已更新为: {new_display_id}")
                
            except Exception as e:
                print(f"❌ 更新记录ID {record_id} 时出错: {str(e)}")
                continue
        
        # 提交事务
        conn.commit()
        print(f"\n🎉 修复完成！共更新了 {updated_count} 条记录。")
        
        # 验证修复结果
        cursor.execute("SELECT COUNT(*) FROM medical_records WHERE display_id IS NULL")
        remaining_null = cursor.fetchone()[0]
        
        if remaining_null == 0:
            print("✅ 验证通过：所有病历记录都已有display_id。")
        else:
            print(f"⚠️  仍有 {remaining_null} 条记录的display_id为NULL，请检查。")
            
    except Exception as e:
        print(f"❌ 修复过程中出错: {str(e)}")
        conn.rollback()
        
    finally:
        conn.close()

def check_data_integrity():
    """
    检查数据完整性
    """
    print("\n=== 数据完整性检查 ===")
    
    conn = sqlite3.connect('nekolinic.db')
    cursor = conn.cursor()
    
    try:
        # 检查总记录数
        cursor.execute("SELECT COUNT(*) FROM medical_records")
        total_records = cursor.fetchone()[0]
        print(f"📊 病历总记录数: {total_records}")
        
        # 检查display_id为NULL的记录数
        cursor.execute("SELECT COUNT(*) FROM medical_records WHERE display_id IS NULL")
        null_count = cursor.fetchone()[0]
        print(f"🔍 display_id为NULL的记录数: {null_count}")
        
        # 检查display_id重复的记录
        cursor.execute("""
            SELECT display_id, COUNT(*) as count 
            FROM medical_records 
            WHERE display_id IS NOT NULL 
            GROUP BY display_id 
            HAVING COUNT(*) > 1
        """)
        
        duplicates = cursor.fetchall()
        if duplicates:
            print(f"⚠️  发现 {len(duplicates)} 个重复的display_id:")
            for display_id, count in duplicates:
                print(f"   - {display_id}: {count} 条记录")
        else:
            print("✅ 没有发现重复的display_id")
            
    except Exception as e:
        print(f"❌ 检查过程中出错: {str(e)}")
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== 病历display_id修复工具 ===")
    
    # 先检查当前状态
    check_data_integrity()
    
    # 执行修复
    fix_display_id_data()
    
    # 再次检查
    check_data_integrity()
    
    print("\n=== 修复完成 ===")