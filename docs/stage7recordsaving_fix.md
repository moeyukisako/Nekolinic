

------

### 指南：彻底修复病历保存问题

我们将分两步完成修复：

1. **完善初始数据**：修改 `init_data` 脚本，确保系统在初始化时，为默认的超级管理员用户创建关联的“诊所”和“医生”身份。
2. **加固权限检查**：修改病历更新的API接口，使其能够安全地处理“非医生用户”的访问，避免程序因空值而出错。

------

#### 步骤一：完善初始数据 (`app/user/init_data.py`)

**目标**：让默认的 `admin@example.com` 用户不仅仅是一个用户，更是一名关联到“Nekolinic”的医生。

**操作**：请用以下完整代码**覆盖**您项目中的 `app/user/init_data.py` 文件。

Python

```
# app/user/init_data.py (最终修正版)

from sqlalchemy.orm import Session
from app.core.config import settings

# --- 新增的 import ---
from app.clinic import service as clinic_service
from app.clinic import schemas as clinic_schemas
# --- 结束 ---

from app.user import service as user_service
from app.user import schemas as user_schemas


def init_db(db: Session) -> None:
    """
    初始化数据库，创建必要的初始数据。
    """
    # 检查并创建超级用户
    user = user_service.get_by_email(db, email=settings.FIRST_SUPERUSER)
    if not user:
        print("Creating superuser...")
        user_in = user_schemas.UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = user_service.create(db, obj_in=user_in)
        print("Superuser created.")

        # --- 新增逻辑：为超级用户创建关联的诊所和医生身份 ---

        # 1. 检查并创建默认诊所 (ID将为1)
        print("Checking for default clinic...")
        default_clinic = clinic_service.clinic_service.get(db, id=1)
        if not default_clinic:
            print("Creating default clinic...")
            clinic_in = clinic_schemas.ClinicCreate(
                name="Nekolinic 总院", 
                address="互联网", 
                contact_number="010-88888888"
            )
            # 使用 create 方法，因为是第一次创建，ID会自动成为1
            default_clinic = clinic_service.clinic_service.create(db, obj_in=clinic_in)
            print(f"Default clinic '{default_clinic.name}' created with ID {default_clinic.id}.")

        # 2. 检查并为超级用户创建关联的医生档案 (ID将为1)
        print("Checking for default doctor profile...")
        admin_doctor = clinic_service.doctor_service.get(db, id=1)
        if not admin_doctor:
            print("Creating doctor profile for superuser...")
            doctor_in = clinic_schemas.DoctorCreate(
                name=user.email.split('@')[0], # 使用邮箱前缀作为名字
                specialty="全科/系统管理", 
                clinic_id=default_clinic.id, # 关联到刚创建的诊所
                user_id=user.id               # 关联到超级用户
            )
            admin_doctor = clinic_service.doctor_service.create(db, obj_in=doctor_in)
            print(f"Doctor profile '{admin_doctor.name}' created and linked to superuser.")
        
        print("Initial data setup complete.")
    else:
        print("Superuser already exists. Skipping initial data setup.")
```

------

#### 步骤二：加固后端权限检查 (`app/patient/api.py`)

**目标**：防止在权限检查时因 `current_user.doctor` 为 `None` 而导致程序崩溃。

**操作**：请找到 `app/patient/api.py` 文件中的 `update_medical_record` 函数，并用以下代码片段替换它。

Python

```
# app/patient/api.py (部分修改)

# ... (文件顶部的 import 保持不变)

@patient_router.put("/medical-records/{record_id}", response_model=schemas.MedicalRecord)
def update_medical_record(
    record_id: int,
    record_in: schemas.MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a medical record.
    """
    record = medical_record_service.get(db, id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    
    # --- 【核心修正】更安全的权限检查 ---
    # 1. 首先检查当前用户是否有关联的医生身份
    if not current_user.doctor:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: The current user does not have a doctor profile."
        )
    
    # 2. 然后再比较医生ID是否匹配
    if record.doctor_id != current_user.doctor.id:
         raise HTTPException(
             status_code=403, 
             detail="Forbidden: You are not authorized to update this record."
        )
    # --- 修正结束 ---

    updated_record = medical_record_service.update(db=db, db_obj=record, obj_in=record_in)
    return updated_record

# ... (文件的其余部分保持不变)
```

------

### 最后一步：应用更改

为了让新的 `init_data.py` 脚本能够生效，您需要一个全新的数据库。

1. **删除旧的数据库文件**：在您的项目根目录下，找到并删除 `nekoclinic.db` 文件。

2. 重新初始化数据库

   ：

   - 您可以直接运行 `init_db.py` 脚本：`python init_db.py`。
   - 或者，直接启动主应用 `main.py`，它在启动时会自动调用 `init_db`。您会在终端看到 "Creating superuser..." 等打印信息。

3. 重启后端服务

   ：如果您正在使用 

   ```
   uvicorn
   ```

   ，请停止它并重新启动，以加载所有修改后的Python代码。

   Bash

   ```
   uvicorn main:app --reload
   ```

4. **测试**：现在登录前端应用，进入任意患者的病历页面。修改**包括主诉、诊断在内**的任何字段，它们都应该能在延迟后被正确地自动保存。

至此，您的应用不仅修复了当前的bug，而且整体的数据一致性和代码健壮性都得到了提升。