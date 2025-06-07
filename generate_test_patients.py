import random
import json
from datetime import datetime, timedelta
import requests
from faker import Faker
import sqlite3
from pathlib import Path

# 初始化Faker，使用中文
fake = Faker('zh_CN')

# 配置项
NUM_PATIENTS = 100
API_BASE_URL = "http://localhost:8000/api/v1"
DB_PATH = "nekolinic.db"  # 数据库路径

# 使用哪种方式：'api' 或 'db'
METHOD = 'db'

# 性别列表
GENDERS = ['男', '女']

# 常见病史列表
MEDICAL_HISTORIES = [
    "无明显既往病史",
    "高血压，长期服用降压药",
    "2型糖尿病病史5年，血糖控制一般",
    "支气管哮喘，季节性发作",
    "过敏性鼻炎，对花粉过敏",
    "冠心病，曾做过心脏支架手术",
    "甲状腺功能减退，规律服药",
    "慢性胃炎，有反流症状",
    "骨质疏松，定期补钙",
    "肺炎史，2年前有过一次住院",
    "胆结石，超声发现未手术",
    "癫痫病史，长期服用抗癫痫药物",
    "类风湿关节炎，关节疼痛反复发作",
    "青光眼，定期复查眼压",
    "慢性肾功能不全，轻度",
    "慢性阻塞性肺疾病，有吸烟史",
    "慢性肝炎，乙肝携带者",
    "痛风，有高尿酸血症",
    "帕金森病早期，症状轻微",
    "轻度抑郁症，间断服药"
]

def generate_random_date(start_year=1940, end_year=2010):
    """生成随机日期"""
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    delta = end_date - start_date
    random_days = random.randrange(delta.days)
    return (start_date + timedelta(days=random_days)).strftime('%Y-%m-%d')

def generate_patient_data():
    """生成一个随机患者数据"""
    gender = random.choice(GENDERS)
    
    # 根据性别选择名字
    name = fake.name_male() if gender == '男' else fake.name_female()
    
    return {
        "name": name,
        "birth_date": generate_random_date(),
        "gender": gender,
        "contact_number": fake.phone_number(),
        "address": fake.address(),
        "past_medical_history": random.choice(MEDICAL_HISTORIES)
    }

def add_patients_via_api(num_patients):
    """通过API添加患者"""
    # 首先登录获取令牌
    login_data = {"username": "admin", "password": "password"}
    response = requests.post(f"{API_BASE_URL}/users/login", data=json.dumps(login_data), 
                            headers={"Content-Type": "application/json"})
    
    if response.status_code != 200:
        print(f"登录失败: {response.text}")
        return False
    
    token = response.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 添加患者
    success_count = 0
    for i in range(num_patients):
        patient_data = generate_patient_data()
        response = requests.post(f"{API_BASE_URL}/patients/", 
                                data=json.dumps(patient_data),
                                headers=headers)
        
        if response.status_code == 200:
            success_count += 1
            print(f"已添加患者 {i+1}/{num_patients}: {patient_data['name']}")
        else:
            print(f"添加患者失败: {response.text}")
    
    print(f"成功添加了 {success_count}/{num_patients} 个患者")
    return success_count == num_patients

def add_patients_via_db(num_patients):
    """直接通过数据库添加患者"""
    if not Path(DB_PATH).exists():
        print(f"数据库文件不存在: {DB_PATH}")
        return False
    
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 获取当前时间作为创建时间
        current_time = datetime.now().isoformat()
        
        for i in range(num_patients):
            patient_data = generate_patient_data()
            
            # 插入患者数据
            cursor.execute(
                """
                INSERT INTO patients (name, birth_date, gender, contact_number, address, past_medical_history, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_data["name"],
                    patient_data["birth_date"],
                    patient_data["gender"],
                    patient_data["contact_number"],
                    patient_data["address"],
                    patient_data["past_medical_history"],
                    current_time,
                    current_time
                )
            )
            
            if i % 10 == 0:
                conn.commit()  # 每10个患者提交一次事务
                print(f"已添加 {i+1}/{num_patients} 个患者")
        
        # 最后提交
        conn.commit()
        print(f"成功添加了 {num_patients} 个患者")
        return True
        
    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print(f"开始生成 {NUM_PATIENTS} 个测试患者数据...")
    
    if METHOD == 'api':
        success = add_patients_via_api(NUM_PATIENTS)
    else:
        success = add_patients_via_db(NUM_PATIENTS)
    
    if success:
        print("所有测试患者数据已成功添加！")
    else:
        print("添加测试患者数据时遇到问题。") 