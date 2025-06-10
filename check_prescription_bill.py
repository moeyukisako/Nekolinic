import sqlite3

conn = sqlite3.connect('nekolinic.db')
cursor = conn.cursor()

# 首先检查所有表名
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('所有表名:')
for t in tables:
    print(t[0])

# 检查是否有处方相关的表
if any('prescription' in t[0].lower() for t in tables):
    print('\n=== 处方相关表 ===')
    
    # 检查处方记录
    try:
        cursor.execute('SELECT * FROM prescriptions')
        prescriptions = cursor.fetchall()
        print('处方记录数:', len(prescriptions))
        for p in prescriptions[:5]:  # 只显示前5条
            print(f'处方ID: {p[0]}, 病历ID: {p[1]}, 患者ID: {p[2]}, 医生ID: {p[3]}')
    except Exception as e:
        print('处方表查询失败:', e)
    
    # 检查处方明细
    try:
        cursor.execute('SELECT * FROM prescription_details')
        details = cursor.fetchall()
        print('\n处方明细记录数:', len(details))
        for d in details[:5]:  # 只显示前5条
            print(f'明细ID: {d[0]}, 处方ID: {d[1]}, 药品ID: {d[2]}, 数量: {d[3]}')
    except Exception as e:
        print('处方明细表查询失败:', e)
else:
    print('\n未找到处方相关的表')

# 检查账单明细
try:
    cursor.execute('SELECT * FROM bill_items')
    items = cursor.fetchall()
    print('\n账单明细记录数:', len(items))
    for i in items:
        print(f'明细ID: {i[0]}, 账单ID: {i[1]}, 项目名称: {i[2]}, 类型: {i[3]}, 数量: {i[4]}, 单价: {i[5]}')
except Exception as e:
    print('账单明细表查询失败:', e)

# 检查药品表
try:
    cursor.execute('SELECT id, name, unit_price FROM drugs')
    drugs = cursor.fetchall()
    print('\n药品记录数:', len(drugs))
    for drug in drugs[:5]:  # 只显示前5条
        print(f'药品ID: {drug[0]}, 名称: {drug[1]}, 单价: {drug[2]}')
except Exception as e:
    print('药品表查询失败:', e)

conn.close()