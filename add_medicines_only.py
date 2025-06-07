import requests
import json
import time
import random
from datetime import datetime

# API配置
BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "admin"
PASSWORD = "password"

def get_access_token():
    """获取访问令牌"""
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(f"{BASE_URL}/users/login", json=login_data, headers=headers)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"登录失败: {response.status_code} - {response.text}")
        return None

def create_medicine(token, medicine_data):
    """创建药品"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(f"{BASE_URL}/pharmacy/medicines/", 
                           headers=headers, 
                           json=medicine_data)
    
    if response.status_code == 200:
        print(f"成功添加药品: {medicine_data['name']}")
        return response.json()
    else:
        print(f"添加药品失败: {response.status_code} - {response.text}")
        return None

# 50种常见药品数据
common_medicines = [
    {"name": "阿莫西林胶囊", "code": "AMX001", "unit_price": 15.50, "stock_quantity": 500, "unit": "盒", "description": "抗生素，用于治疗细菌感染"},
    {"name": "布洛芬片", "code": "IBU001", "unit_price": 8.20, "stock_quantity": 300, "unit": "盒", "description": "解热镇痛药，用于退热和缓解疼痛"},
    {"name": "对乙酰氨基酚片", "code": "ACE001", "unit_price": 6.80, "stock_quantity": 400, "unit": "盒", "description": "解热镇痛药，用于退热和轻度疼痛"},
    {"name": "头孢克肟胶囊", "code": "CEF001", "unit_price": 28.90, "stock_quantity": 200, "unit": "盒", "description": "第三代头孢菌素，广谱抗生素"},
    {"name": "甘草片", "code": "LIC001", "unit_price": 4.50, "stock_quantity": 600, "unit": "盒", "description": "止咳化痰，用于咳嗽痰多"},
    {"name": "维生素C片", "code": "VTC001", "unit_price": 12.00, "stock_quantity": 800, "unit": "瓶", "description": "维生素补充剂，增强免疫力"},
    {"name": "复方甘草口服液", "code": "LIC002", "unit_price": 18.60, "stock_quantity": 150, "unit": "瓶", "description": "止咳祛痰，用于咳嗽"},
    {"name": "氯雷他定片", "code": "LOR001", "unit_price": 22.30, "stock_quantity": 250, "unit": "盒", "description": "抗过敏药，用于过敏性鼻炎和荨麻疹"},
    {"name": "奥美拉唑肠溶胶囊", "code": "OME001", "unit_price": 35.80, "stock_quantity": 180, "unit": "盒", "description": "质子泵抑制剂，用于胃酸过多"},
    {"name": "蒙脱石散", "code": "MON001", "unit_price": 16.70, "stock_quantity": 320, "unit": "盒", "description": "止泻药，用于急慢性腹泻"},
    {"name": "硝苯地平缓释片", "code": "NIF001", "unit_price": 42.50, "stock_quantity": 120, "unit": "盒", "description": "钙通道阻滞剂，用于高血压"},
    {"name": "阿司匹林肠溶片", "code": "ASP001", "unit_price": 9.90, "stock_quantity": 450, "unit": "盒", "description": "抗血小板聚集，用于心血管疾病预防"},
    {"name": "二甲双胍片", "code": "MET001", "unit_price": 18.40, "stock_quantity": 280, "unit": "盒", "description": "降糖药，用于2型糖尿病"},
    {"name": "氨氯地平片", "code": "AML001", "unit_price": 25.60, "stock_quantity": 200, "unit": "盒", "description": "钙通道阻滞剂，用于高血压和心绞痛"},
    {"name": "左氧氟沙星片", "code": "LEV001", "unit_price": 32.80, "stock_quantity": 160, "unit": "盒", "description": "喹诺酮类抗生素，广谱抗菌"},
    {"name": "复方丹参滴丸", "code": "DAN001", "unit_price": 28.50, "stock_quantity": 220, "unit": "瓶", "description": "活血化瘀，用于冠心病心绞痛"},
    {"name": "感冒灵颗粒", "code": "COL001", "unit_price": 14.20, "stock_quantity": 380, "unit": "盒", "description": "解热镇痛，用于感冒发热"},
    {"name": "板蓝根颗粒", "code": "BAN001", "unit_price": 11.80, "stock_quantity": 500, "unit": "盒", "description": "清热解毒，用于感冒咽痛"},
    {"name": "罗红霉素胶囊", "code": "ROX001", "unit_price": 24.70, "stock_quantity": 190, "unit": "盒", "description": "大环内酯类抗生素"},
    {"name": "氢氯噻嗪片", "code": "HCT001", "unit_price": 8.90, "stock_quantity": 350, "unit": "盒", "description": "利尿剂，用于高血压和水肿"},
    {"name": "卡托普利片", "code": "CAP001", "unit_price": 12.60, "stock_quantity": 300, "unit": "盒", "description": "ACE抑制剂，用于高血压"},
    {"name": "硫酸沙丁胺醇气雾剂", "code": "SAL001", "unit_price": 38.90, "stock_quantity": 100, "unit": "支", "description": "支气管扩张剂，用于哮喘"},
    {"name": "地塞米松片", "code": "DEX001", "unit_price": 6.50, "stock_quantity": 400, "unit": "盒", "description": "糖皮质激素，抗炎免疫抑制"},
    {"name": "多潘立酮片", "code": "DOM001", "unit_price": 19.80, "stock_quantity": 240, "unit": "盒", "description": "胃肠动力药，用于消化不良"},
    {"name": "西咪替丁片", "code": "CIM001", "unit_price": 13.40, "stock_quantity": 280, "unit": "盒", "description": "H2受体拮抗剂，用于胃溃疡"},
    {"name": "复合维生素B片", "code": "VTB001", "unit_price": 15.20, "stock_quantity": 600, "unit": "瓶", "description": "维生素B族补充剂"},
    {"name": "钙尔奇D片", "code": "CAL001", "unit_price": 45.60, "stock_quantity": 150, "unit": "瓶", "description": "钙和维生素D补充剂"},
    {"name": "藿香正气水", "code": "HUO001", "unit_price": 8.80, "stock_quantity": 400, "unit": "盒", "description": "解表化湿，用于胃肠感冒"},
    {"name": "三九感冒灵", "code": "999001", "unit_price": 16.50, "stock_quantity": 350, "unit": "盒", "description": "解热镇痛，用于感冒发热"},
    {"name": "咳特灵胶囊", "code": "KET001", "unit_price": 21.30, "stock_quantity": 200, "unit": "盒", "description": "止咳化痰，用于咳嗽痰多"},
    {"name": "速效救心丸", "code": "SOS001", "unit_price": 52.80, "stock_quantity": 80, "unit": "瓶", "description": "行气活血，用于心绞痛急救"},
    {"name": "硝酸甘油片", "code": "NTG001", "unit_price": 18.90, "stock_quantity": 120, "unit": "瓶", "description": "血管扩张剂，用于心绞痛"},
    {"name": "胰岛素注射液", "code": "INS001", "unit_price": 68.50, "stock_quantity": 60, "unit": "支", "description": "降血糖，用于糖尿病"},
    {"name": "肝素钠注射液", "code": "HEP001", "unit_price": 25.40, "stock_quantity": 100, "unit": "支", "description": "抗凝血剂，预防血栓"},
    {"name": "青霉素V钾片", "code": "PEN001", "unit_price": 12.80, "stock_quantity": 300, "unit": "盒", "description": "青霉素类抗生素"},
    {"name": "红霉素肠溶片", "code": "ERY001", "unit_price": 16.70, "stock_quantity": 250, "unit": "盒", "description": "大环内酯类抗生素"},
    {"name": "氯霉素眼药水", "code": "CHL001", "unit_price": 4.20, "stock_quantity": 500, "unit": "支", "description": "抗菌眼药，用于眼部感染"},
    {"name": "庆大霉素注射液", "code": "GEN001", "unit_price": 8.60, "stock_quantity": 200, "unit": "支", "description": "氨基糖苷类抗生素"},
    {"name": "利福平胶囊", "code": "RIF001", "unit_price": 22.90, "stock_quantity": 150, "unit": "盒", "description": "抗结核药物"},
    {"name": "异烟肼片", "code": "INH001", "unit_price": 9.50, "stock_quantity": 300, "unit": "盒", "description": "抗结核药物"},
    {"name": "氟康唑胶囊", "code": "FLU001", "unit_price": 35.20, "stock_quantity": 120, "unit": "盒", "description": "抗真菌药物"},
    {"name": "酮康唑片", "code": "KET002", "unit_price": 28.40, "stock_quantity": 180, "unit": "盒", "description": "抗真菌药物"},
    {"name": "阿昔洛韦片", "code": "ACV001", "unit_price": 19.60, "stock_quantity": 220, "unit": "盒", "description": "抗病毒药物"},
    {"name": "利巴韦林片", "code": "RIB001", "unit_price": 24.80, "stock_quantity": 160, "unit": "盒", "description": "抗病毒药物"},
    {"name": "复方氨酚烷胺片", "code": "COM001", "unit_price": 13.70, "stock_quantity": 400, "unit": "盒", "description": "复方感冒药"},
    {"name": "小儿氨酚黄那敏颗粒", "code": "PED001", "unit_price": 18.20, "stock_quantity": 300, "unit": "盒", "description": "儿童感冒药"},
    {"name": "开塞露", "code": "GLY001", "unit_price": 3.50, "stock_quantity": 800, "unit": "支", "description": "通便药，用于便秘"},
    {"name": "碘伏消毒液", "code": "IOD001", "unit_price": 6.80, "stock_quantity": 600, "unit": "瓶", "description": "外用消毒剂"},
    {"name": "创可贴", "code": "BAN002", "unit_price": 5.20, "stock_quantity": 1000, "unit": "盒", "description": "外伤包扎用品"},
    {"name": "医用酒精", "code": "ALC001", "unit_price": 8.50, "stock_quantity": 500, "unit": "瓶", "description": "75%医用酒精，消毒用"}
]

def main():
    print("开始添加50种药品数据...")
    
    # 获取访问令牌
    token = get_access_token()
    if not token:
        print("无法获取访问令牌，程序退出")
        return
    
    print(f"成功获取访问令牌")
    
    # 添加药品数据
    success_count = 0
    for i, medicine in enumerate(common_medicines, 1):
        print(f"\n正在添加第 {i}/50 种药品: {medicine['name']}")
        
        result = create_medicine(token, medicine)
        if result:
            success_count += 1
        
        # 添加小延迟避免请求过快
        time.sleep(0.5)
    
    print(f"\n药品数据添加完成！")
    print(f"成功添加: {success_count}/50 种药品")
    print(f"失败: {50 - success_count} 种药品")

if __name__ == "__main__":
    main()