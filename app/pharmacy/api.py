from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from app.core.database import get_db
from app.core import security
from app.core.schemas import PaginatedResponse
from app.user import models as user_models
from . import schemas, service

router = APIRouter()

# --- 药品类别API ---
# --- Drug Routes --- 药品API ---
@router.post("/drugs/", response_model=schemas.Drug)
def create_drug(
    drug_in: schemas.DrugCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建药品 (需要认证)"""
    existing = service.drug_service.get_by_code(db, code=drug_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"药品代码 {drug_in.code} 已存在"
        )
    return service.drug_service.create(db=db, obj_in=drug_in)

@router.get("/drugs/", response_model=PaginatedResponse[schemas.Drug])
def read_drugs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有药品 (需要认证)"""
    return service.drug_service.get_paginated(db, skip=skip, limit=limit)

@router.get("/drugs/{drug_id}", response_model=schemas.Drug)
def read_drug(
    drug_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """根据ID获取药品 (需要认证)"""
    drug = service.drug_service.get(db, id=drug_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {drug_id} 不存在"
        )
    return drug

@router.put("/drugs/{drug_id}", response_model=schemas.Drug)
def update_drug(
    drug_id: int,
    drug_in: schemas.DrugUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新药品 (需要认证)"""
    drug = service.drug_service.get(db, id=drug_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {drug_id} 不存在"
        )
    return service.drug_service.update(db=db, db_obj=drug, obj_in=drug_in)

@router.delete("/drugs/{drug_id}", response_model=schemas.Drug)
def delete_drug(
    drug_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """删除药品 (需要管理员权限)"""
    drug = service.drug_service.get(db, id=drug_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {drug_id} 不存在"
        )
    return service.drug_service.remove(db=db, id=drug_id)

# --- 处方API ---
@router.post("/prescriptions/", response_model=schemas.Prescription)
def create_prescription(
    prescription_in: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建处方（含明细） (需要认证)"""
    return service.prescription_service.create(db=db, obj_in=prescription_in)

@router.get("/prescriptions/", response_model=List[schemas.Prescription])
def read_prescriptions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有处方 (需要认证)"""
    return service.prescription_service.get_multi(db, skip=skip, limit=limit)

@router.get("/prescriptions/{prescription_id}", response_model=schemas.Prescription)
def read_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """根据ID获取处方（含明细） (需要认证)"""
    prescription = service.prescription_service.get_with_details(db, id=prescription_id)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"处方 ID {prescription_id} 不存在"
        )
    return prescription

@router.put("/prescriptions/{prescription_id}", response_model=schemas.Prescription)
def update_prescription(
    prescription_id: int,
    prescription_in: schemas.PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新处方状态 (需要认证)"""
    prescription = service.prescription_service.get(db, id=prescription_id)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"处方 ID {prescription_id} 不存在"
        )
    return service.prescription_service.update(db=db, db_obj=prescription, obj_in=prescription_in)

# --- 库存API ---
@router.post("/inventory/stock-in", response_model=schemas.InventoryTransaction)
def add_stock(
    stock_in: schemas.StockInRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """药品入库 (需要认证)"""
    return service.inventory_service.add_stock(
        db=db, 
        drug_id=stock_in.drug_id,
        quantity=stock_in.quantity,
        notes=stock_in.notes
    )

@router.post("/inventory/dispense", response_model=List[schemas.InventoryTransaction])
def dispense_prescription(
    dispense_request: schemas.DispenseRequest,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """根据处方发药 (需要认证)"""
    return service.inventory_service.dispense_drugs(
        db=db,
        prescription_id=dispense_request.prescription_id,
        notes=dispense_request.notes
    )

@router.get("/inventory/stocks", response_model=List[schemas.StockResponse])
def get_all_stocks(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有药品的当前库存 (需要认证)"""
    return service.inventory_service.get_all_stocks(db)

@router.get("/inventory/drugs/{drug_id}/stock", response_model=schemas.StockResponse)
def get_drug_stock(
    drug_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定药品的当前库存 (需要认证)"""
    drug = service.drug_service.get(db, id=drug_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {drug_id} 不存在"
        )
    
    current_stock = service.inventory_service.get_current_stock(db, drug_id=drug_id)
    return {
        "drug_id": drug.id,
        "drug_name": drug.name,
        "current_stock": current_stock
    }

@router.get("/inventory/drugs/{drug_id}/history", response_model=List[schemas.InventoryTransaction])
def get_stock_history(
    drug_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定药品的库存变动历史 (需要认证)"""
    drug = service.drug_service.get(db, id=drug_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {drug_id} 不存在"
        )
    
    return service.inventory_service.get_stock_history(db, drug_id=drug_id, skip=skip, limit=limit)

@router.get("/inventory/low-stock", response_model=List[schemas.StockResponse])
def get_low_stock_drugs(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取库存低于阈值的药品 (需要认证)"""
    return service.inventory_service.get_low_stock_drugs(db)

# 别名路由，与/inventory/drugs/{drug_id}/history功能相同，为兼容测试
@router.get("/inventory/drugs/{drug_id}/transactions", response_model=List[schemas.InventoryTransaction])
def get_drug_transactions(
    drug_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取指定药品的库存交易历史 (需要认证)"""
    drug = service.drug_service.get(db, id=drug_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {drug_id} 不存在"
        )
    
    return service.inventory_service.get_stock_history(db, drug_id=drug_id, skip=skip, limit=limit)

# --- Medicines API (别名路由，兼容前端) ---
@router.post("/medicines/", response_model=schemas.Drug)
def create_medicine(
    drug_in: schemas.DrugCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建药品 (medicines别名路由)"""
    existing = service.drug_service.get_by_code(db, code=drug_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"药品代码 {drug_in.code} 已存在"
        )
    return service.drug_service.create(db=db, obj_in=drug_in)

@router.get("/medicines/", response_model=PaginatedResponse[schemas.Drug])
def read_medicines(
    skip: int = 0,
    limit: int = 100,
    search: str = "",
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有药品 (medicines别名路由)"""
    if search:
        # 如果有搜索参数，使用搜索功能
        return service.drug_service.search_by_name_paginated(db, name=search, skip=skip, limit=limit)
    return service.drug_service.get_paginated(db, skip=skip, limit=limit)

@router.get("/medicines/{medicine_id}", response_model=schemas.Drug)
def read_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """根据ID获取药品 (medicines别名路由)"""
    drug = service.drug_service.get(db, id=medicine_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {medicine_id} 不存在"
        )
    return drug

@router.put("/medicines/{medicine_id}", response_model=schemas.Drug)
def update_medicine(
    medicine_id: int,
    drug_in: schemas.DrugUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新药品 (medicines别名路由)"""
    drug = service.drug_service.get(db, id=medicine_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {medicine_id} 不存在"
        )
    return service.drug_service.update(db=db, db_obj=drug, obj_in=drug_in)

@router.delete("/medicines/{medicine_id}", response_model=schemas.Drug)
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """删除药品 (medicines别名路由)"""
    drug = service.drug_service.get(db, id=medicine_id)
    if not drug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品 ID {medicine_id} 不存在"
        )
    return service.drug_service.remove(db=db, id=medicine_id)
