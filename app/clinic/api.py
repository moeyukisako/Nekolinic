from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import schemas, service
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException

router = APIRouter()

# --- Doctor Endpoints ---
@router.post("/doctors/", response_model=schemas.Doctor)
def create_doctor(doctor_in: schemas.DoctorCreate, db: Session = Depends(get_db)):
    """创建医生"""
    return service.doctor_service.create(db=db, obj_in=doctor_in)

@router.get("/doctors/", response_model=List[schemas.Doctor])
def read_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有医生列表"""
    return service.doctor_service.get_multi(db, skip=skip, limit=limit)

@router.get("/doctors/{doctor_id}", response_model=schemas.Doctor)
def read_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """获取特定医生信息"""
    doctor = service.doctor_service.get(db, id=doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")
    return doctor

@router.put("/doctors/{doctor_id}", response_model=schemas.Doctor)
def update_doctor(doctor_id: int, doctor_in: schemas.DoctorUpdate, db: Session = Depends(get_db)):
    """更新医生信息"""
    doctor = service.doctor_service.get(db, id=doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")
    return service.doctor_service.update(db, db_obj=doctor, obj_in=doctor_in)

@router.delete("/doctors/{doctor_id}", response_model=schemas.Doctor)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """删除医生"""
    doctor = service.doctor_service.get(db, id=doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")
    return service.doctor_service.remove(db, id=doctor_id)

# --- Appointment Endpoints ---
@router.post("/appointments/", response_model=schemas.Appointment)
def create_appointment(appt_in: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    """创建预约"""
    return service.appointment_service.create(db=db, obj_in=appt_in)

@router.get("/appointments/", response_model=List[schemas.Appointment])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有预约列表"""
    return service.appointment_service.get_multi(db, skip=skip, limit=limit)

@router.get("/appointments/{appointment_id}", response_model=schemas.AppointmentWithDoctor)
def read_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """获取特定预约信息(含医生信息)"""
    appointment = service.appointment_service.get(db, id=appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")
    return appointment

@router.put("/appointments/{appointment_id}", response_model=schemas.Appointment)
def update_appointment(appointment_id: int, appt_in: schemas.AppointmentUpdate, db: Session = Depends(get_db)):
    """更新预约信息"""
    appointment = service.appointment_service.get(db, id=appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")
    return service.appointment_service.update(db, db_obj=appointment, obj_in=appt_in)

@router.delete("/appointments/{appointment_id}/cancel", response_model=schemas.Appointment)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """取消预约"""
    try:
        return service.appointment_service.cancel_appointment(db, id=appointment_id)
    except ResourceNotFoundException:
        raise HTTPException(status_code=404, detail="预约不存在")

@router.get("/doctors/{doctor_id}/appointments/", response_model=List[schemas.Appointment])
def read_doctor_appointments(doctor_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取指定医生的所有预约"""
    doctor = service.doctor_service.get(db, id=doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")
    return service.appointment_service.get_by_doctor_id(db, doctor_id=doctor_id, skip=skip, limit=limit)
