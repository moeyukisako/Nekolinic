class NekolicBaseException(Exception):
    """
    所有自定义异常的基类
    """
    def __init__(self, message: str = "An error occurred"):
        self.message = message
        super().__init__(self.message)


class ResourceNotFoundException(NekolicBaseException):
    """
    资源未找到异常的通用基类
    """
    def __init__(self, resource_type: str, resource_id: int):
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} with id {resource_id} not found")


class PatientNotFoundException(ResourceNotFoundException):
    """
    病患未找到异常
    """
    def __init__(self, patient_id: int):
        super().__init__("Patient", patient_id)
        self.patient_id = patient_id


class DoctorNotFoundException(ResourceNotFoundException):
    """
    医生未找到异常
    """
    def __init__(self, doctor_id: int):
        super().__init__("Doctor", doctor_id)
        self.doctor_id = doctor_id


class MedicalRecordNotFoundException(ResourceNotFoundException):
    """
    病历未找到异常
    """
    def __init__(self, record_id: int):
        super().__init__("Medical Record", record_id)
        self.record_id = record_id


class DrugNotFoundException(ResourceNotFoundException):
    """
    药品未找到异常
    """
    def __init__(self, drug_id: int):
        super().__init__("Drug", drug_id)
        self.drug_id = drug_id


class DrugCategoryNotFoundException(ResourceNotFoundException):
    """
    药品类别未找到异常
    """
    def __init__(self, category_id: int):
        super().__init__("Drug Category", category_id)
        self.category_id = category_id


class PrescriptionNotFoundException(ResourceNotFoundException):
    """
    处方未找到异常
    """
    def __init__(self, prescription_id: int):
        super().__init__("Prescription", prescription_id)
        self.prescription_id = prescription_id


class InsufficientStockException(NekolicBaseException):
    """
    库存不足异常
    """
    def __init__(self, drug_name: str, requested: int, current_stock: int):
        self.drug_name = drug_name
        self.current_stock = current_stock
        self.requested = requested
        super().__init__(f"库存不足：药品 {drug_name} 当前库存 {current_stock}，需求数量 {requested}")


class ValidationException(NekolicBaseException):
    """
    数据验证异常
    """
    def __init__(self, message: str = "Validation error", errors: dict = None):
        self.errors = errors or {}
        super().__init__(message)


class AuthenticationException(NekolicBaseException):
    """
    认证异常
    """
    pass


class AuthorizationException(NekolicBaseException):
    """
    授权异常
    """
    pass


class BusinessLogicException(NekolicBaseException):
    """
    业务逻辑异常
    """
    pass
