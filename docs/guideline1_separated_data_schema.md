============================================================
   資料庫表結構與功能模組分佈說明 (V3.0 最終審計版)
============================================================

核心設計原則
----------
本文件旨在將原有的中央化 schema.py 拆解，遵循「高內聚，低耦合」的原則，將每個資料庫模型 (Table/Model) 放置到其所屬的業務功能模組中。

本版（V3.0）是基於 V2.0 增強版的最終形態，其核心目標是實現數據的**完全可追溯性 (Full Traceability)**。我們透過引入“雙層審計”來實現這一目標：

1.  **基礎審計字段**: 在所有關鍵業務表上增加 created_at, updated_at, created_by_id, updated_by_id 四個字段。這提供了對數據當前狀態的快速審計能力，能立即知道“誰在何時最後修改了它”。

2.  **完整歷史記錄表 (History/Log Tables)**: 為每一個關鍵業務表創建一個與之對應的 `_history` 表。此表只增不刪，完整記錄該業務數據的每一次**創建(INSERT)**、**更新(UPDATE)**和**刪除(DELETE)**操作，構成了一條不可篡改的審計日誌鏈。這是滿足醫療合規性、進行事故追溯和責任界定的黃金標準。

------------------------------------------------------------
### 1. 用戶與認證模組 (user)
------------------------------------------------------------
* **文件位置**: `app/user/models.py`
* **職責**: 管理所有可登錄系統的帳號及其基本信息。用戶自身的變動也需要被審計。

    --- 用戶表 (users) ---
    * 類別名稱: User
    * 說明: 存儲系統操作員（管理員、醫生、藥師等）的登錄憑證和基本資料，是系統認證與授權的基礎。

        字段: id
          - 資料形態: Integer
          - 主鍵/外鍵: 主鍵 (PK)
          - 說明: 自動遞增的唯一標識符。

        字段: username
          - 資料形態: String(50)
          - 主鍵/外鍵: 無
          - 說明: 用戶登錄名，必須唯一且不可為空。

        字段: email
          - 資料形態: String(100)
          - 主鍵/外鍵: 無
          - 說明: 用戶的電子郵箱，必須唯一且不可為空。

        字段: full_name
          - 資料形態: String(100)
          - 主鍵/外鍵: 無
          - 說明: 用戶的真實姓名，可為空。

        字段: hashed_password
          - 資料形態: String(255)
          - 主鍵/外鍵: 無
          - 說明: 不可為空，存儲經過加鹽哈希處理後的密碼，確保密碼安全。

        字段: role
          - 資料形態: String(50)
          - 主鍵/外鍵: 無
          - 說明: 不可為空，定義用戶的角色，用於權限控制 (例如: 'admin', 'doctor', 'pharmacist')。

        字段: is_active
          - 資料形態: Boolean
          - 主鍵/外鍵: 無
          - 說明: 標識帳號是否啟用，可用於禁用帳號，默認為 True。

        字段: created_at
          - 資料形態: DateTime
          - 主鍵/外鍵: 無
          - 說明: (審計) 記錄該條數據的創建時間。

        字段: updated_at
          - 資料形態: DateTime
          - 主鍵/外鍵: 無
          - 說明: (審計) 記錄該條數據最後一次的修改時間。

        字段: created_by_id
          - 資料形態: Integer
          - 主鍵/外鍵: 外键 (FK) -> users.id
          - 說明: (審計) 記錄創建此用戶的用戶ID。

        字段: updated_by_id
          - 資料形態: Integer
          - 主鍵/外鍵: 外键 (FK) -> users.id
          - 說明: (審計) 記錄最後修改此用戶的用戶ID。

    --- 用戶歷史表 (users_history) ---
    * 類別名稱: UserHistory
    * 說明: (審計) 記錄 `users` 表的每一次數據變更（創建、更新、刪除），提供完整的、不可篡改的歷史追溯記錄。

        字段: history_id
          - 資料形態: Integer
          - 主鍵/外鍵: 主鍵 (PK)
          - 說明: 歷史記錄自身的唯一ID，自動遞增。

        字段: action_type
          - 資料形態: String(10)
          - 主鍵/外鍵: 無
          - 說明: 記錄操作類型，值為 'INSERT', 'UPDATE', 或 'DELETE'。

        字段: action_timestamp
          - 資料形態: DateTime
          - 主鍵/外鍵: 無
          - 說明: 記錄操作發生的精確時間戳。

        字段: action_by_id
          - 資料形態: Integer
          - 主鍵/外鍵: 外键 (FK) -> users.id
          - 說明: 記錄執行此操作的用戶ID。

        字段: id
          - 資料形態: Integer
          - 主鍵/外鍵: 無
          - 說明: 被操作記錄的ID (即原 `users.id`)。

        字段: username, email, full_name, hashed_password, role, is_active
          - 資料形態: (同上)
          - 主鍵/外鍵: 無
          - 說明: 在操作發生時，`users` 表中對應記錄的所有字段的數據快照。

------------------------------------------------------------
### 2. 診所運營模組 (clinic)
------------------------------------------------------------
* **文件位置**: `app/clinic/models.py`
* **職責**: 管理診所的核心資源（醫生）以及醫病之間的互動（預約）。

    --- 醫生表 (doctors) ---
    * 類別名稱: Doctor
    * 說明: 存儲醫生的專業信息，並與一個系統用戶帳號關聯，代表了系統中可以提供醫療服務的專業人員實體。

        字段: id, name, specialty, user_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含醫生姓名、專業、關聯的用戶ID，以及完整的基礎審計字段。

    --- 醫生歷史表 (doctors_history) ---
    * 類別名稱: DoctorHistory
    * 說明: (審計) 記錄 `doctors` 表的每一次創建、更新和刪除操作，用於追溯醫生信息的變更歷史。

        字段: history_id, action_type, action_timestamp, action_by_id, id, name, specialty, user_id
          - 說明: 包含標準審計元數據，以及 `doctors` 表所有業務字段的數據快照。

    --- 預約表 (appointments) ---
    * 類別名稱: Appointment
    * 說明: 記錄病患的預約掛號信息，是連接病患與醫生的橋樑，也是臨床工作流的起點。

        字段: id, appointment_time, status, patient_id, doctor_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含預約時間、狀態（如 'scheduled', 'completed'）、關聯的病患和醫生ID，以及完整的基礎審計字段。

    --- 預約歷史表 (appointments_history) ---
    * 類別名稱: AppointmentHistory
    * 說明: (審計) 記錄 `appointments` 表的每一次狀態變更，例如預約的創建、完成或取消，為醫患糾紛提供依據。

        字段: history_id, action_type, action_timestamp, action_by_id, id, appointment_time, status, patient_id, doctor_id
          - 說明: 包含標準審計元數據，以及 `appointments` 表所有業務字段的數據快照。

------------------------------------------------------------
### 3. 病患模組 (patient)
------------------------------------------------------------
* **文件位置**: `app/patient/models.py`
* **職責**: 管理最核心的病患個人檔案與所有的就診病歷，需要最高級別的審計。

    --- 病患表 (patients) ---
    * 類別名稱: Patient
    * 說明: 存儲病患的個人基本資料（人口學信息），是整個醫療信息系統的核心實體之一。

        字段: id, name, gender, birth_date, id_card_number, contact_number, address, blood_type, allergies, emergency_contact_name, emergency_contact_phone, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含病患的詳細個人信息，以及V2.0增強的血型、過敏史、緊急聯繫人等字段和完整的基礎審計字段。

    --- 病患歷史表 (patients_history) ---
    * 類別名稱: PatientHistory
    * 說明: (審計) 記錄 `patients` 表的每一次信息變更，特別是聯繫方式、過敏史等關鍵信息的修改，對醫療安全至關重要。

        字段: history_id, action_type, action_timestamp, action_by_id, id, name, gender, ... (所有 patients 字段)
          - 說明: 包含標準審計元數據，以及 `patients` 表所有業務字段的數據快照。

    --- 病歷表 (medical_records) ---
    * 類別名稱: MedicalRecord
    * 說明: 記錄病患在某一次就診中的完整臨床信息，是醫療行為的核心載體。

        字段: id, record_date, chief_complaint, objective_findings, diagnosis, treatment_plan, patient_id, doctor_id, appointment_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含符合SOAP格式的病歷記錄、關聯的病患、醫生，以及V2.0增強的與預約的關聯，並附帶完整的基礎審計字段。

    --- 病歷歷史表 (medical_records_history) ---
    * 類別名稱: MedicalRecordHistory
    * 說明: (審計) 記錄 `medical_records` 表的每一次變更，特別是診斷和治療計劃的修改，是醫療質量控制和責任界定的關鍵依據。

        字段: history_id, action_type, action_timestamp, action_by_id, id, record_date, ... (所有 medical_records 字段)
          - 說明: 包含標準審計元數據，以及 `medical_records` 表所有業務字段的數據快照。

    --- 生命體征表 (vital_signs) ---
    * 類別名稱: VitalSign
    * 說明: (增強) 記錄每次就診時測量的客觀生命體征數據，與病歷一一對應，為診斷提供量化依據。

        字段: id, temperature, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, height, weight, measured_at, medical_record_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含體溫、血壓、心率等詳細體征數據，並關聯到唯一的病歷ID，附帶完整的基礎審計字段。

    --- 生命體征歷史表 (vital_signs_history) ---
    * 類別名稱: VitalSignHistory
    * 說明: (審計) 記錄 `vital_signs` 表的每一次數據修正，防止原始測量數據被篡改。

        字段: history_id, action_type, action_timestamp, action_by_id, id, temperature, ... (所有 vital_signs 字段)
          - 說明: 包含標準審計元數據，以及 `vital_signs` 表所有業務字段的數據快照。

------------------------------------------------------------
### 4. 藥局模組 (pharmacy)
------------------------------------------------------------
* **文件位置**: `app/pharmacy/models.py`
* **職責**: 管理藥品、處方和库存，確保用藥安全和庫存準確。

    --- 藥品分類表 (drug_categories) ---
    * 類別名稱: DrugCategory
    * 說明: 對藥品進行分類，便於管理和查找。

        字段: id, name, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含分類名稱和基礎審計字段。

    --- 藥品分類歷史表 (drug_categories_history) ---
    * 類別名稱: DrugCategoryHistory
    * 說明: (審計) 記錄藥品分類的變更歷史。

        字段: history_id, action_type, action_timestamp, action_by_id, id, name
          - 說明: 包含標準審計元數據和 `drug_categories` 的字段快照。

    --- 藥品表 (drugs) ---
    * 類別名稱: Drug
    * 說明: 存儲診所使用的所有藥品的基礎信息，如價格、單位、分類等。

        字段: id, name, code, unit, unit_price, cost_price, category_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含藥品詳細信息和基礎審計字段。

    --- 藥品歷史表 (drugs_history) ---
    * 類別名稱: DrugHistory
    * 說明: (審計) 記錄藥品信息的變更歷史，特別是價格等敏感信息的修改。

        字段: history_id, action_type, action_timestamp, action_by_id, id, name, code, ... (所有 drugs 字段)
          - 說明: 包含標準審計元數據和 `drugs` 的字段快照。

    --- 庫存交易流水表 (inventory_transactions) ---
    * 類別名稱: InventoryTransaction
    * 說明: (增強) 此表本身就是一種審計日誌，採用只增不刪的模式記錄每一次的庫存變動事件（如入库、发药、盘点调整），確保庫存的完全可追溯性。它取代了原有的簡單庫存表。

        字段: id, transaction_time, transaction_type, quantity_change, notes, drug_id, action_by_id
          - 說明: `quantity_change` 記錄變動量（正為增，負為減），`transaction_type` 記錄變動原因。此表設計已內含審計思想，無需再配備歷史表。

    --- 處方主表 (prescriptions) ---
    * 類別名稱: Prescription
    * 說明: 記錄醫生開立的處方頭信息，並管理處方的整體狀態。

        字段: id, prescription_date, dispensing_status, medical_record_id, doctor_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含開立日期、關聯的病歷和醫生，以及V2.0增強的發藥狀態，並附帶完整的基礎審計字段。

    --- 處方主表歷史表 (prescriptions_history) ---
    * 類別名稱: PrescriptionHistory
    * 說明: (審計) 記錄處方狀態的變更歷史，例如從“待發藥”到“已發藥”的過程。

        字段: history_id, action_type, action_timestamp, action_by_id, id, prescription_date, ... (所有 prescriptions 字段)
          - 說明: 包含標準審計元數據和 `prescriptions` 的字段快照。

    --- 處方明細表 (prescription_details) ---
    * 類別名稱: PrescriptionDetail
    * 說明: 記錄一個處方中包含的每種藥品的具體用藥指示，是極其敏感的醫療信息。

        字段: id, dosage, frequency, days, quantity, prescription_id, drug_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含劑量、頻率等詳細用藥信息，並附帶完整的基礎審計字段。

    --- 處方明細歷史表 (prescription_details_history) ---
    * 類別名稱: PrescriptionDetailHistory
    * 說明: (審計) 記錄處方明細的每一次變更，對防止用藥錯誤、界定醫療責任至關重要。

        字段: history_id, action_type, action_timestamp, action_by_id, id, dosage, ... (所有 prescription_details 字段)
          - 說明: 包含標準審計元數據和 `prescription_details` 的字段快照。

------------------------------------------------------------
### 5. 財務模組 (finance)
------------------------------------------------------------
* **文件位置**: `app/finance/models.py`
* **職責**: 管理所有與計費、支付、保險和帳務相關的模型，確保財務數據的準確性和可追溯性。

    --- 保險信息表 (insurances) ---
    * 類別名稱: Insurance
    * 說明: 存儲病患的保險信息。

        字段: id, provider_name, policy_number, patient_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含保險公司、保單號、關聯的病患，以及基礎審計字段。

    --- 保險信息歷史表 (insurances_history) ---
    * 類別名稱: InsuranceHistory
    * 說明: (審計) 記錄病患保險信息的變更歷史。

        字段: history_id, action_type, action_timestamp, action_by_id, id, provider_name, ... (所有 insurances 字段)
          - 說明: 包含標準審計元數據和 `insurances` 的字段快照。

    --- 帳單主表 (bills) ---
    * 類別名稱: Bill
    * 說明: 記錄每次就診或服務產生的總帳單信息，是收費的依據。

        字段: id, invoice_number, bill_date, total_amount, status, patient_id, medical_record_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含V2.0增強的唯一發票號和與病歷的關聯，以及完整的基礎審計字段。

    --- 帳單主表歷史表 (bills_history) ---
    * 類別名稱: BillHistory
    * 說明: (審計) 記錄帳單的創建、作廢、狀態變更等歷史，對財務核對至關重要。

        字段: history_id, action_type, action_timestamp, action_by_id, id, invoice_number, ... (所有 bills 字段)
          - 說明: 包含標準審計元數據和 `bills` 的字段快照。

    --- 帳單明細表 (bill_items) ---
    * 類別名稱: BillItem
    * 說明: 記錄帳單中的每一個收費項目（如掛號費、檢查費、藥品費）。

        字段: id, item_name, item_type, quantity, unit_price, subtotal, bill_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含收費項目的詳細信息，並附帶完整的基礎審計字段。

    --- 帳單明細歷史表 (bill_items_history) ---
    * 類別名稱: BillItemHistory
    * 說明: (審計) 記錄帳單明細的任何修改或刪除操作。

        字段: history_id, action_type, action_timestamp, action_by_id, id, item_name, ... (所有 bill_items 字段)
          - 說明: 包含標準審計元數據和 `bill_items` 的字段快照。

    --- 支付記錄表 (payments) ---
    * 類別名稱: Payment
    * 說明: 記錄每一筆來自病患的支付流水，是財務收入的直接記錄。

        字段: id, payment_date, amount, payment_method, bill_id, created_at, updated_at, created_by_id, updated_by_id
          - 說明: 包含支付金額、方式、關聯的帳單，以及完整的基礎審計字段。

    --- 支付記錄歷史表 (payments_history) ---
    * 類別名稱: PaymentHistory
    * 說明: (審計) 記錄支付記錄的創建與作廢（如退款）操作，確保資金流水的準確性。

        字段: history_id, action_type, action_timestamp, action_by_id, id, payment_date, ... (所有 payments 字段)
          - 說明: 包含標準審計元數據和 `payments` 的字段快照。