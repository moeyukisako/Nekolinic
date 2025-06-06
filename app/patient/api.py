from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from . import schemas, service
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.core import security
from app.user import models as user_models

router = APIRouter()

# --- Patient Endpoints ---
@router.post("/", response_model=schemas.Patient)
def create_patient(
    patient_in: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建新患者 (需要认证)"""
    return service.patient_service.create(db=db, obj_in=patient_in)

@router.get("/", response_model=List[schemas.Patient])
def read_patients(
    name: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取患者列表，可选按姓名搜索 (需要认证)"""
    if name:
        return service.patient_service.search_patients(db, name=name, skip=skip, limit=limit)
    return service.patient_service.get_multi(db, skip=skip, limit=limit)

@router.get("/{patient_id}", response_model=schemas.Patient)
def read_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取特定患者信息 (需要认证)"""
    patient = service.patient_service.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    return patient

@router.get("/{patient_id}/full", response_model=schemas.PatientWithMedicalRecords)
def read_patient_with_records(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取患者信息，包含其所有病历 (需要认证)"""
    try:
        return service.patient_service.get_patient_with_medical_records(db, id=patient_id)
    except ResourceNotFoundException:
        raise HTTPException(status_code=404, detail="患者不存在")

@router.put("/{patient_id}", response_model=schemas.Patient)
def update_patient(
    patient_id: int,
    patient_in: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新患者信息 (需要认证)"""
    patient = service.patient_service.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    return service.patient_service.update(db, db_obj=patient, obj_in=patient_in)

@router.delete("/{patient_id}", response_model=schemas.Patient)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """删除患者 (需要管理员权限)"""
    patient = service.patient_service.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    return service.patient_service.remove(db, id=patient_id)

# --- MedicalRecord Endpoints ---
@router.post("/{patient_id}/medical-records/", response_model=schemas.MedicalRecord)
def create_patient_medical_record(
    patient_id: int, 
    record_in: schemas.MedicalRecordCreate, 
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """为特定患者创建病历 (需要认证)"""
    # 确保患者存在
    patient = service.patient_service.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    
    # 确保record_in中的patient_id与URL中的一致
    if record_in.patient_id != patient_id:
        raise HTTPException(status_code=400, detail="URL中的患者ID与请求体中的不一致")
    
    return service.medical_record_service.create(db=db, obj_in=record_in)

@router.get("/{patient_id}/medical-records/", response_model=List[schemas.MedicalRecord])
def read_patient_medical_records(
    patient_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取特定患者的所有病历 (需要认证)"""
    # 确保患者存在
    patient = service.patient_service.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="患者不存在")
    
    return service.medical_record_service.get_by_patient_id(db, patient_id=patient_id, skip=skip, limit=limit)

# --- MedicalRecord Endpoints (独立) ---
@router.get("/medical-records/{record_id}", response_model=schemas.MedicalRecord)
def read_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取特定病历 (需要认证)"""
    record = service.medical_record_service.get(db, id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="病历不存在")
    return record

@router.put("/medical-records/{record_id}", response_model=schemas.MedicalRecord)
def update_medical_record(
    record_id: int,
    record_in: schemas.MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新病历 (需要认证)"""
    record = service.medical_record_service.get(db, id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="病历不存在")
    return service.medical_record_service.update(db, db_obj=record, obj_in=record_in)

# --- VitalSign Endpoints ---
@router.post("/medical-records/{record_id}/vital-signs/", response_model=schemas.VitalSign)
def create_vital_sign(
    record_id: int,
    vital_sign_in: schemas.VitalSignCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """为指定病历添加生命体征 (需要认证)"""
    try:
        # 确保vital_sign_in中的medical_record_id与URL中的一致
        if vital_sign_in.medical_record_id != record_id:
            raise HTTPException(status_code=400, detail="URL中的病历ID与请求体中的不一致")
        
        return service.vital_sign_service.create_for_medical_record(
            db=db, medical_record_id=record_id, vital_sign_in=vital_sign_in
        )
    except ResourceNotFoundException:
        raise HTTPException(status_code=404, detail="病历不存在")
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.get("/medical-records/{record_id}/vital-signs/", response_model=schemas.VitalSign)
def read_vital_sign(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定病历的生命体征 (需要认证)"""
    vital_sign = service.vital_sign_service.get_by_medical_record_id(db, medical_record_id=record_id)
    if not vital_sign:
        raise HTTPException(status_code=404, detail="生命体征记录不存在")
    return vital_sign

@router.put("/vital-signs/{vital_sign_id}", response_model=schemas.VitalSign)
def update_vital_sign(
    vital_sign_id: int, 
    vital_sign_in: schemas.VitalSignUpdate, 
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新生命体征记录 (需要认证)"""
    vital_sign = service.vital_sign_service.get(db, id=vital_sign_id)
    if not vital_sign:
        raise HTTPException(status_code=404, detail="生命体征记录不存在")
    return service.vital_sign_service.update(db, db_obj=vital_sign, obj_in=vital_sign_in)
