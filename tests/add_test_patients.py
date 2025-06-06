import requests
import random
from datetime import date, timedelta
import time

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

# 使用API创建患者
def create_patient(token, patient_data):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_URL}/patients/", 
        json=patient_data,
        headers=headers
    )
    return response

def main():
    # 获取访问令牌
    print("正在登录获取访问令牌...")
    token = get_access_token()
    print("登录成功，开始添加测试患者数据")
    
    # 创建50条随机患者数据
    today = date.today()
    start_date = date(today.year - 80, 1, 1)
    end_date = date(today.year - 20, 12, 31)
    
    added_count = 0
    failed_count = 0
    
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
            # 创建患者
            response = create_patient(token, patient_data)
            
            if response.status_code == 200 or response.status_code == 201:
                added_count += 1
                print(f"成功添加第{added_count}条: {name}")
            else:
                failed_count += 1
                print(f"添加失败 (HTTP {response.status_code}): {response.text}")
                
            # 添加小延迟，避免过快请求
            time.sleep(0.1)  
            
        except Exception as e:
            failed_count += 1
            print(f"发生错误: {e}")
    
    print(f"完成! 成功添加: {added_count}, 失败: {failed_count}")

if __name__ == "__main__":
    main() 