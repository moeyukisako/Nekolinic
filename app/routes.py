from fastapi import APIRouter

# 创建主路由器
router = APIRouter()

# 目前尚未创建各模块的API，因此以下代码暂时注释掉
# 随着各模块的实现，可以逐步取消注释并导入相应路由

# 导入各模块路由
from .user.api import router as user_router
from .patient.api import router as patient_router
from .clinic.api import router as clinic_router
from .pharmacy.api import router as pharmacy_router
from .finance.api import router as finance_router
from .reports.api import router as reports_router

# 注册各模块路由
router.include_router(user_router, prefix="/users", tags=["用户管理"])
router.include_router(patient_router, prefix="/patients", tags=["患者管理"])
router.include_router(clinic_router, prefix="/clinic", tags=["诊所管理"])
router.include_router(pharmacy_router, prefix="/pharmacy", tags=["药局管理"])
router.include_router(finance_router, prefix="/finance", tags=["财务管理"])
router.include_router(reports_router, prefix="/reports", tags=["报告与分析"])
