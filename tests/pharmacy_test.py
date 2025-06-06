"""
Pharmacy module test file.
"""

def test_pharmacy_import():
    try:
        from app.pharmacy import models
        print("Successfully imported app.pharmacy.models")
        assert True
    except Exception as e:
        print(f"Failed to import app.pharmacy.models: {e}")
        assert False

if __name__ == "__main__":
    test_pharmacy_import() 