import sqlite3

conn = sqlite3.connect('nekolinic.db')
cursor = conn.cursor()

print('=== 处方明细表结构 ===')
cursor.execute('PRAGMA table_info(prescription_details)')
for row in cursor.fetchall():
    print(f'列: {row[1]}, 类型: {row[2]}, 非空: {row[3]}, 默认值: {row[4]}, 主键: {row[5]}')

print('\n=== 处方明细数据 ===')
cursor.execute('SELECT id, prescription_id, drug_id, quantity FROM prescription_details')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, 处方ID: {row[1]}, 药品ID: {row[2]}, 数量: {row[3]}')

conn.close()