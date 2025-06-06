from app.patient.models import Patient
from app.patient.schemas import PatientCreate
from app.core.database import SessionLocal
from datetime import date, datetime, timedelta
import random

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

try:
    # 创建40条随机患者数据
    patients = []
    
    # 定义日期范围 - 患者从20岁到80岁
    today = date.today()
    start_date = date(today.year - 80, 1, 1)
    end_date = date(today.year - 20, 12, 31)
    
    print(f'开始生成40条患者测试数据...')
    
    for i in range(1, 41):
        gender_index = random.randint(0, 1)
        gender = genders[gender_index]
        
        # 生成中文姓名
        last_name = random.choice(last_names)
        first_name = random.choice(first_names[gender_index])
        name = f"{last_name}{first_name}"
        
        # 生成出生日期
        birth_date = random_date(start_date, end_date)
        
        # 生成患者数据
        patient_data = PatientCreate(
            name=name,
            gender=gender,
            birth_date=birth_date,
            contact_number=generate_phone(),
            address=generate_address()
        )
        patients.append(patient_data)
    
    # 连接数据库
    db = SessionLocal()
    
    # 导入患者服务
    from app.patient.service import patient_service
    
    # 一条一条添加，确保不会有问题
    for i, patient_data in enumerate(patients, 1):
        try:
            # 为了避免 current_user_id 相关错误，直接使用模型创建数据
            db_obj = Patient(
                name=patient_data.name,
                gender=patient_data.gender,
                birth_date=patient_data.birth_date,
                contact_number=patient_data.contact_number,
                address=patient_data.address,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by_id=1,  # 管理员ID
                updated_by_id=1   # 管理员ID
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            print(f'已添加第{i}条: {db_obj.name}')
        except Exception as e:
            print(f'添加第{i}条数据时出错: {e}')
            db.rollback()
    
    print('患者数据添加完成！')
    
except Exception as e:
    print(f"发生错误: {e}")
finally:
    if 'db' in locals():
        db.close() 