import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.pharmacy import models, schemas, service
from app.user.models import User
from datetime import datetime

@pytest.fixture
def test_drug(db: Session):
    """创建测试药品"""
    drug = models.Drug(
        name="Test Drug",
        code="TEST-001",
        description="Test description",
        specification="100mg",
        manufacturer="Test Manufacturer",
        unit="tablet",
        unit_price=10.00,
        cost_price=5.00,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(drug)
    db.commit()
    db.refresh(drug)
    return drug

def test_stock_in(client: TestClient, db: Session, test_drug, admin_user: User):
    """测试药品入库功能"""
    # 执行入库操作
    stock_in_data = {
        "drug_id": test_drug.id,
        "quantity": 50,
        "notes": "Initial stock"
    }
    response = client.post(
        "/api/v1/pharmacy/inventory/stock-in",
        json=stock_in_data
    )
    
    assert response.status_code == 200
    
    # 验证库存更新
    stock_response = client.get(
        f"/api/v1/pharmacy/inventory/drugs/{test_drug.id}/stock"
    )
    assert stock_response.status_code == 200
    stock_data = stock_response.json()
    assert stock_data["current_stock"] == 50

def test_negative_quantity_fails(client: TestClient, db: Session, test_drug, admin_user: User):
    """测试负数入库量应该失败"""
    # 尝试负数入库
    stock_in_data = {
        "drug_id": test_drug.id,
        "quantity": -10,
        "notes": "Negative stock"
    }
    response = client.post(
        "/api/v1/pharmacy/inventory/stock-in",
        json=stock_in_data
    )
    
    # FastAPI会自动验证quantity > 0，返回422错误
    assert response.status_code == 422

def test_low_stock_threshold(client: TestClient, db: Session, test_drug, admin_user: User):
    """测试低库存阈值检查"""
    # 首先入库5个药品（低于默认阈值10）
    stock_in_data = {
        "drug_id": test_drug.id,
        "quantity": 5,
        "notes": "Low stock"
    }
    client.post(
        "/api/v1/pharmacy/inventory/stock-in",
        json=stock_in_data
    )
    
    # 获取低库存药品列表
    response = client.get(
        "/api/v1/pharmacy/inventory/low-stock"
    )
    
    assert response.status_code == 200
    low_stock_drugs = response.json()
    
    # 验证我们的测试药品在低库存列表中
    assert any(drug["drug_id"] == test_drug.id for drug in low_stock_drugs)

def test_inventory_transaction_history(client: TestClient, db: Session, test_drug, admin_user: User):
    """测试库存交易历史记录"""
    # 执行入库操作
    stock_in_data = {
        "drug_id": test_drug.id,
        "quantity": 30,
        "notes": "History test"
    }
    client.post(
        "/api/v1/pharmacy/inventory/stock-in",
        json=stock_in_data
    )
    
    # 查询库存交易历史
    response = client.get(
        f"/api/v1/pharmacy/inventory/drugs/{test_drug.id}/transactions"
    )
    
    assert response.status_code == 200
    transactions = response.json()
    
    # 验证交易记录存在
    assert len(transactions) > 0
    assert any(tx["quantity_change"] == 30 and tx["notes"] == "History test" for tx in transactions)