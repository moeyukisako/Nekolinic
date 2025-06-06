from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from app.core.database import get_db
from app.core import security
from app.user import models as user_models
from . import schemas, service

router = APIRouter()

# --- 药品类别API ---
@router.post("/categories/", response_model=schemas.DrugCategory)
def create_drug_category(
    category_in: schemas.DrugCategoryCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """创建药品类别 (需要认证)"""
    existing = service.drug_category_service.get_by_name(db, name=category_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="同名药品类别已存在"
        )
    return service.drug_category_service.create(db=db, obj_in=category_in)

@router.get("/categories/", response_model=List[schemas.DrugCategory])
def read_drug_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有药品类别 (需要认证)"""
    return service.drug_category_service.get_multi(db, skip=skip, limit=limit)

@router.get("/categories/{category_id}", response_model=schemas.DrugCategory)
def read_drug_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """根据ID获取药品类别 (需要认证)"""
    category = service.drug_category_service.get(db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品类别 ID {category_id} 不存在"
        )
    return category

@router.put("/categories/{category_id}", response_model=schemas.DrugCategory)
def update_drug_category(
    category_id: int,
    category_in: schemas.DrugCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """更新药品类别 (需要认证)"""
    category = service.drug_category_service.get(db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品类别 ID {category_id} 不存在"
        )
    return service.drug_category_service.update(db=db, db_obj=category, obj_in=category_in)

@router.delete("/categories/{category_id}", response_model=schemas.DrugCategory)
def delete_drug_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.requires_role("admin"))
):
    """删除药品类别 (需要管理员权限)"""
    category = service.drug_category_service.get(db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"药品类别 ID {category_id} 不存在"
        )
    return service.drug_category_service.remove(db=db, id=category_id)

# --- 药品API ---
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

@router.get("/drugs/", response_model=List[schemas.Drug])
def read_drugs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(security.get_current_active_user)
):
    """获取所有药品 (需要认证)"""
    return service.drug_service.get_multi(db, skip=skip, limit=limit)

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
