"""
App module import test.
"""

def test_app_import():
    try:
        import app
        print("Successfully imported app")
        
        try:
            import app.core
            print("Successfully imported app.core")
        except Exception as e:
            print(f"Failed to import app.core: {e}")
        
        try:
            import app.pharmacy
            print("Successfully imported app.pharmacy")
            
            try:
                from app.pharmacy import models
                print("Successfully imported app.pharmacy.models")
            except Exception as e:
                print(f"Failed to import app.pharmacy.models: {e}")
                
        except Exception as e:
            print(f"Failed to import app.pharmacy: {e}")
            
    except Exception as e:
        print(f"Failed to import app: {e}")

if __name__ == "__main__":
    test_app_import() 