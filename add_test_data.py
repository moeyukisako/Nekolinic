#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from sqlalchemy import create_engine, text
from app.core.database import SessionLocal, engine
from datetime import date, datetime, timedelta
from decimal import Decimal
import random

# 患者数据生成常量
genders = ['男', '女']
phone_prefixes = ['130', '131', '132', '133', '135', '136', '137', '138', '139',
                '151', '152', '153', '155', '156', '157', '158', '159',
                '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
districts = ['海淀区', '朝阳区', '丰台区', '石景山区', '通州区', '昌平区', '大兴区', '顺义区', '房山区', '门头沟区']
streets = ['中关村大街', '学院路', '知春路', '海淀大街', '清华东路', '西直门外大街', '北三环西路', '颐和园路', '万柳大街', '紫竹院路']
communities = ['阳光小区', '康居家园', '百合花园', '御景园', '水岸花园', '龙湖花园', '金色家园', '蓝色港湾', '绿色家园', '万科城市花园']

first_names = [
    # 男性名
    ['军', '伟', '强', '磊', '洋', '勇', '明', '超', '刚', '平', '辉', '健', '峰', '帅', '毅', '杰', '涛', '亮', '鹏', '宇'],
    # 女性名
    ['芳', '娟', '敏', '静', '霞', '丽', '娜', '燕', '婷', '玲', '艳', '萍', '红', '梅', '琳', '倩', '雪', '洁', '莉', '佳']
]

last_names = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗']

# 药品数据常量
drug_names = [
    '阿莫西林胶囊', '头孢拉定胶囊', '阿司匹林肠溶片', '布洛芬缓释胶囊', '对乙酰氨基酚片',
    '甲硝唑片', '左氧氟沙星片', '罗红霉素胶囊', '克拉霉素片', '阿奇霉素片',
    '奥美拉唑肠溶胶囊', '雷尼替丁胶囊', '多潘立酮片', '蒙脱石散', '复方甘草片',
    '氨茶碱片', '沙丁胺醇气雾剂', '右美沙芬片', '氯雷他定片', '西替利嗪片',
    '硝苯地平缓释片', '卡托普利片', '美托洛尔片', '氢氯噻嗪片', '辛伐他汀片',
    '二甲双胍片', '格列齐特缓释片', '胰岛素注射液', '维生素B1片', '维生素C片'
]

manufacturers = [
    '华北制药股份有限公司', '石药集团有限公司', '扬子江药业集团有限公司',
    '哈药集团制药股份有限公司', '华润双鹤药业股份有限公司', '北京同仁堂股份有限公司',
    '广州白云山制药股份有限公司', '上海医药集团股份有限公司', '江苏恒瑞医药股份有限公司',
    '山东鲁抗医药股份有限公司'
]

units = ['片', '粒', '瓶', '支', '盒', '袋']
specifications = ['0.25g*24片/盒', '0.5g*12粒/盒', '100mg*20片/盒', '200ml/瓶', '10ml*5支/盒', '3g*6袋/盒']

def generate_address():
    """生成随机地址"""
    district = random.choice(districts)
    street = random.choice(streets)
    community = random.choice(communities)
    building = f'{random.randint(1, 30)}号楼'
    room = f'{random.randint(1, 6)}-{random.randint(101, 2505)}'
    return f'北京市{district}{street}{community}{building}{room}'

def generate_phone():
    """生成随机电话号码"""
    prefix = random.choice(phone_prefixes)
    suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return f'{prefix}{suffix}'

def random_date(start_date, end_date):
    """生成随机日期"""
    delta = end_date - start_date
    random_days = random.randrange(delta.days)
    return start_date + timedelta(days=random_days)

def generate_drug_code(index):
    """生成药品编码"""
    return f'DRUG{str(index).zfill(4)}'

def add_patients(db):
    """添加30个患者"""
    print('开始生成30个患者数据...')
    
    # 定义日期范围 - 患者从20岁到80岁
    today = date.today()
    start_date = date(today.year - 80, 1, 1)
    end_date = date(today.year - 20, 12, 31)
    
    for i in range(1, 31):
        gender_index = random.randint(0, 1)
        gender = genders[gender_index]
        
        # 生成中文姓名
        last_name = random.choice(last_names)
        first_name = random.choice(first_names[gender_index])
        name = f"{last_name}{first_name}"
        
        # 生成出生日期
        birth_date = random_date(start_date, end_date)
        
        try:
            # 使用原生SQL插入数据
            sql = text("""
                INSERT INTO patients (name, gender, birth_date, contact_number, address, created_at, updated_at, created_by_id, updated_by_id)
                VALUES (:name, :gender, :birth_date, :contact_number, :address, :created_at, :updated_at, :created_by_id, :updated_by_id)
            """)
            
            db.execute(sql, {
                'name': name,
                'gender': gender,
                'birth_date': birth_date,
                'contact_number': generate_phone(),
                'address': generate_address(),
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'created_by_id': 1,
                'updated_by_id': 1
            })
            db.commit()
            print(f'已添加患者 {i}/30: {name}')
        except Exception as e:
            print(f'添加患者第{i}条数据时出错: {e}')
            db.rollback()

def add_drugs(db):
    """添加30种药品"""
    print('开始生成30种药品数据...')
    
    for i in range(30):
        drug_name = drug_names[i]
        
        try:
            # 使用原生SQL插入数据
            sql = text("""
                INSERT INTO drugs (name, code, description, specification, manufacturer, unit, unit_price, cost_price, created_at, updated_at, created_by_id, updated_by_id)
                VALUES (:name, :code, :description, :specification, :manufacturer, :unit, :unit_price, :cost_price, :created_at, :updated_at, :created_by_id, :updated_by_id)
            """)
            
            db.execute(sql, {
                'name': drug_name,
                'code': generate_drug_code(i + 1),
                'description': f'{drug_name}的详细描述，用于治疗相关疾病。',
                'specification': random.choice(specifications),
                'manufacturer': random.choice(manufacturers),
                'unit': random.choice(units),
                'unit_price': round(random.uniform(5.0, 200.0), 2),
                'cost_price': round(random.uniform(2.0, 100.0), 2),
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'created_by_id': 1,
                'updated_by_id': 1
            })
            db.commit()
            print(f'已添加药品 {i+1}/30: {drug_name}')
        except Exception as e:
            print(f'添加药品第{i+1}条数据时出错: {e}')
            db.rollback()

def main():
    """主函数"""
    try:
        # 连接数据库
        db = SessionLocal()
        
        print('开始添加测试数据...')
        
        # 添加患者数据
        add_patients(db)
        
        # 添加药品数据
        add_drugs(db)
        
        print('\n所有测试数据添加完成！')
        print('- 已添加30个患者')
        print('- 已添加30种药品')
        
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == '__main__':
    main()