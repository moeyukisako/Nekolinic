import sqlite3

conn = sqlite3.connect('nekolinic.db')
cursor = conn.cursor()

print('=== 处方表结构 ===')
cursor.execute('PRAGMA table_info(prescriptions)')
for row in cursor.fetchall():
    print(f'列: {row[1]}, 类型: {row[2]}, 非空: {row[3]}, 默认值: {row[4]}, 主键: {row[5]}')

print('\n=== 处方数据 ===')
cursor.execute('SELECT id, medical_record_id, doctor_id FROM prescriptions')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, 病历ID: {row[1]} (类型: {type(row[1])}), 医生ID: {row[2]}')

print('\n=== 病历表数据 ===')
cursor.execute('SELECT id, display_id, record_date FROM medical_records')
for row in cursor.fetchall():
    print(f'病历ID: {row[0]}, 显示ID: {row[1]}, 记录日期: {row[2]}')

conn.close()