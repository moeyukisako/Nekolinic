import sqlite3

conn = sqlite3.connect('nekolinic.db')
cursor = conn.cursor()

print('=== 处方记录 ===')
cursor.execute('SELECT * FROM prescriptions')
for row in cursor.fetchall():
    print(f'处方ID: {row[0]}, 病历ID: {row[1]}, 状态: {row[2]}, 医生ID: {row[3]}')

print('\n=== 处方明细 ===')
cursor.execute('SELECT * FROM prescription_details')
for row in cursor.fetchall():
    print(f'明细ID: {row[0]}, 处方ID: {row[1]}, 药品ID: {row[2]}, 数量: {row[3]}')

print('\n=== 药品账单明细 ===')
cursor.execute('SELECT * FROM bill_items WHERE item_type = "药物"')
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f'明细ID: {row[0]}, 账单ID: {row[1]}, 项目名称: {row[2]}, 类型: {row[3]}, 数量: {row[4]}, 单价: {row[5]}, 小计: {row[6]}')
else:
    print('没有找到药品账单明细')

print('\n=== 所有账单明细 ===')
cursor.execute('SELECT * FROM bill_items')
for row in cursor.fetchall():
    print(f'明细ID: {row[0]}, 账单ID: {row[1]}, 项目名称: {row[2]}, 类型: {row[3]}, 数量: {row[4]}, 单价: {row[5]}, 小计: {row[6]}')

conn.close()