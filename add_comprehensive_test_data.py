#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import random
from datetime import date, timedelta, datetime
import time
import json

# 定义一些测试数据生成所需的常量
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

# 常见疾病和症状
common_diseases = [
    '感冒', '发热', '咳嗽', '头痛', '胃炎', '高血压', '糖尿病', '关节炎', '失眠', '焦虑症',
    '支气管炎', '肺炎', '胃溃疡', '十二指肠溃疡', '冠心病', '心律不齐', '贫血', '甲状腺功能亢进',
    '肾结石', '胆结石', '脂肪肝', '慢性肾炎', '类风湿关节炎', '骨质疏松', '抑郁症', '偏头痛'
]

common_symptoms = [
    '发热', '咳嗽', '头痛', '乏力', '食欲不振', '恶心', '呕吐', '腹痛', '腹泻', '便秘',
    '胸痛', '气短', '心悸', '头晕', '失眠', '多梦', '关节疼痛', '肌肉酸痛', '皮疹', '瘙痒'
]

common_medications = [
    {'name': '阿莫西林胶囊', 'code': 'AMXL001', 'specification': '0.25g*24粒', 'unit': '盒', 'unit_price': 15.80},
    {'name': '布洛芬缓释胶囊', 'code': 'BLFS001', 'specification': '0.3g*20粒', 'unit': '盒', 'unit_price': 12.50},
    {'name': '复方甘草片', 'code': 'FFGC001', 'specification': '100片', 'unit': '瓶', 'unit_price': 8.90},
    {'name': '维生素C片', 'code': 'WSSC001', 'specification': '0.1g*100片', 'unit': '瓶', 'unit_price': 6.50},
    {'name': '感冒灵颗粒', 'code': 'GML001', 'specification': '10g*9袋', 'unit': '盒', 'unit_price': 18.60},
    {'name': '头孢克肟胶囊', 'code': 'TFKW001', 'specification': '0.1g*12粒', 'unit': '盒', 'unit_price': 28.90},
    {'name': '奥美拉唑肠溶胶囊', 'code': 'OMLZ001', 'specification': '20mg*14粒', 'unit': '盒', 'unit_price': 22.30},
    {'name': '硝苯地平缓释片', 'code': 'XBDP001', 'specification': '20mg*30片', 'unit': '盒', 'unit_price': 35.70},
    {'name': '二甲双胍片', 'code': 'EJSG001', 'specification': '0.25g*48片', 'unit': '盒', 'unit_price': 16.80},
    {'name': '阿司匹林肠溶片', 'code': 'ASPL001', 'specification': '25mg*30片', 'unit': '盒', 'unit_price': 9.20},
    {'name': '氯雷他定片', 'code': 'LLTD001', 'specification': '10mg*12片', 'unit': '盒', 'unit_price': 14.50},
    {'name': '多潘立酮片', 'code': 'DPLD001', 'specification': '10mg*30片', 'unit': '盒', 'unit_price': 19.80},
    {'name': '左氧氟沙星片', 'code': 'ZYFSX001', 'specification': '0.1g*12片', 'unit': '盒', 'unit_price': 26.40},
    {'name': '蒙脱石散', 'code': 'MTSS001', 'specification': '3g*10袋', 'unit': '盒', 'unit_price': 21.70},
    {'name': '复合维生素B片', 'code': 'FHWSSB001', 'specification': '100片', 'unit': '瓶', 'unit_price': 11.30}
]

# 定义地址生成函数
def generate_address():
    district = random.choice(districts)
    street = random.choice(streets)
    community = random.choice(communities)
    building = f'{random.randint(1, 30)}号楼'
    room = f'{random.randint(1, 6)}-{random.randint(101, 2505)}'
    return f'北京市{district}{street}{community}{building}{room}'

# 定义电话号码生成函数
def generate_phone():
    prefix = random.choice(phone_prefixes)
    suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return f'{prefix}{suffix}'

# 定义随机日期生成函数
def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randrange(delta.days)
    return start_date + timedelta(days=random_days)

# 生成随机体征数据
def generate_vital_signs():
    return {
        'temperature': round(random.uniform(36.0, 39.5), 1),
        'pulse': random.randint(60, 120),
        'respiratory_rate': random.randint(12, 25),
        'blood_pressure': f'{random.randint(90, 180)}/{random.randint(60, 120)}'
    }

# API配置
API_URL = "http://localhost:8000/api/v1"
USERNAME = "admin"
PASSWORD = "password"

# 获取访问令牌
def get_access_token():
    response = requests.post(
        f"{API_URL}/users/login",
        json={"username": USERNAME, "password": PASSWORD}
    )
    if response.status_code != 200:
        print(f"登录失败: {response.text}")
        exit(1)
    return response.json()["access_token"]

# 创建患者
def create_patient(token, patient_data):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_URL}/patients/", 
        json=patient_data,
        headers=headers
    )
    return response

# 创建病历
def create_medical_record(token, patient_id, record_data):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_URL}/patients/{patient_id}/medical-records/", 
        json=record_data,
        headers=headers
    )
    return response

# 创建药品
def create_medication(token, medication_data):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_URL}/pharmacy/medicines/", 
        json=medication_data,
        headers=headers
    )
    return response

def main():
    # 获取访问令牌
    print("正在登录获取访问令牌...")
    token = get_access_token()
    print("登录成功，开始添加测试数据")
    
    # 统计变量
    patients_added = 0
    records_added = 0
    medications_added = 0
    failed_count = 0
    
    # 1. 首先添加药品数据
    print("\n=== 添加药品数据 ===")
    for medication in common_medications:
        try:
            response = create_medication(token, medication)
            if response.status_code in [200, 201]:
                medications_added += 1
                print(f"成功添加药品: {medication['name']}")
            else:
                print(f"添加药品失败: {medication['name']} - {response.text}")
                failed_count += 1
            time.sleep(0.1)
        except Exception as e:
            print(f"添加药品时发生错误: {e}")
            failed_count += 1
    
    # 2. 添加患者数据
    print("\n=== 添加患者数据 ===")
    today = date.today()
    start_date = date(today.year - 80, 1, 1)
    end_date = date(today.year - 20, 12, 31)
    
    patient_ids = []
    
    for i in range(1, 51):
        gender_index = random.randint(0, 1)
        gender = genders[gender_index]
        
        # 生成中文姓名
        last_name = random.choice(last_names)
        first_name = random.choice(first_names[gender_index])
        name = f"{last_name}{first_name}"
        
        # 生成出生日期
        birth_date = random_date(start_date, end_date)
        
        # 生成患者数据
        patient_data = {
            "name": name,
            "gender": gender,
            "birth_date": birth_date.isoformat(),
            "contact_number": generate_phone(),
            "address": generate_address()
        }
        
        try:
            response = create_patient(token, patient_data)
            
            if response.status_code in [200, 201]:
                patient_id = response.json()["id"]
                patient_ids.append(patient_id)
                patients_added += 1
                print(f"成功添加患者 {patients_added}: {name} (ID: {patient_id})")
            else:
                failed_count += 1
                print(f"添加患者失败: {name} - {response.text}")
                
            time.sleep(0.1)
            
        except Exception as e:
            failed_count += 1
            print(f"添加患者时发生错误: {e}")
    
    # 3. 为每个患者添加1-3条病历记录
    print("\n=== 添加病历数据 ===")
    for patient_id in patient_ids:
        num_records = random.randint(1, 3)
        
        for j in range(num_records):
            # 生成病历数据
            vital_signs = generate_vital_signs()
            record_date = random_date(date.today() - timedelta(days=365), date.today())
            
            record_data = {
                "record_date": record_date.isoformat(),
                "chief_complaint": random.choice(common_symptoms),
                "present_illness": f"患者主诉{random.choice(common_symptoms)}，持续{random.randint(1, 7)}天，{random.choice(['逐渐加重', '时轻时重', '持续不缓解'])}",
                "past_history": random.choice(["既往体健", "有高血压病史", "有糖尿病病史", "有心脏病史", "无特殊病史"]),
                "temperature": vital_signs['temperature'],
                "pulse": vital_signs['pulse'],
                "respiratory_rate": vital_signs['respiratory_rate'],
                "blood_pressure": vital_signs['blood_pressure'],
                "physical_examination": f"体温{vital_signs['temperature']}℃，脉搏{vital_signs['pulse']}次/分，呼吸{vital_signs['respiratory_rate']}次/分，血压{vital_signs['blood_pressure']}mmHg",
                "diagnosis": random.choice(common_diseases),
                "treatment_plan": f"给予{random.choice(['对症治疗', '抗感染治疗', '支持治疗', '药物治疗'])}，{random.choice(['注意休息', '多饮水', '清淡饮食', '定期复查'])}",
                "prescription": f"{random.choice([med['name'] for med in common_medications])} {random.choice(['1片 tid', '2片 bid', '1粒 qd', '10ml tid'])}",
                "notes": random.choice(["患者配合治疗", "建议定期复查", "注意观察病情变化", "如有不适及时就诊"]),
                "symptoms": f"{random.choice(common_symptoms)}，{random.choice(common_symptoms)}"
            }
            
            try:
                response = create_medical_record(token, patient_id, record_data)
                
                if response.status_code in [200, 201]:
                    records_added += 1
                    print(f"成功添加病历 {records_added}: 患者ID {patient_id} - {record_data['diagnosis']}")
                else:
                    failed_count += 1
                    print(f"添加病历失败: 患者ID {patient_id} - {response.text}")
                    
                time.sleep(0.1)
                
            except Exception as e:
                failed_count += 1
                print(f"添加病历时发生错误: {e}")
    
    # 输出统计结果
    print("\n=== 数据添加完成 ===")
    print(f"成功添加患者: {patients_added} 条")
    print(f"成功添加病历: {records_added} 条")
    print(f"成功添加药品: {medications_added} 条")
    print(f"失败次数: {failed_count} 次")
    print(f"总计成功: {patients_added + records_added + medications_added} 条")

if __name__ == "__main__":
    main()