#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import os

def check_database():
    # 检查数据库文件
    db_files = ['clinic.db', 'nekolinic.db']
    
    for db_file in db_files:
        if os.path.exists(db_file):
            print(f"\n=== 检查数据库文件: {db_file} ===")
            try:
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                
                # 获取所有表名
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                
                print(f"表数量: {len(tables)}")
                print(f"表列表: {tables}")
                
                # 如果有medical_records表，检查其结构
                if 'medical_records' in tables:
                    cursor.execute("PRAGMA table_info(medical_records);")
                    columns = cursor.fetchall()
                    print("\nmedical_records表结构:")
                    for col in columns:
                        print(f"  {col[1]} ({col[2]}) - NULL: {col[3] == 0}")
                    
                    # 检查display_id为NULL的记录
                    cursor.execute("SELECT COUNT(*) FROM medical_records WHERE display_id IS NULL")
                    null_count = cursor.fetchone()[0]
                    print(f"\ndisplay_id为NULL的记录数: {null_count}")
                    
                    # 检查总记录数
                    cursor.execute("SELECT COUNT(*) FROM medical_records")
                    total_count = cursor.fetchone()[0]
                    print(f"总记录数: {total_count}")
                
                conn.close()
                
            except Exception as e:
                print(f"检查数据库 {db_file} 时出错: {str(e)}")
        else:
            print(f"数据库文件 {db_file} 不存在")

if __name__ == "__main__":
    check_database()