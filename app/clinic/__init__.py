# 诊所模块初始化文件 

from app.clinic.service import doctor_service, appointment_service

# 为了让其他模块可以通过app.clinic.service.clinic_service访问
clinic_service = doctor_service 