# 导入所有模型以确保SQLAlchemy能够正确识别关系
from app.patient import models as patient_models
from app.clinic import models as clinic_models
from app.finance import models as finance_models
from app.pharmacy import models as pharmacy_models
from app.user import models as user_models