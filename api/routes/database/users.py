from api.routes import schemas

def check_user_exists(db: dict, email: str) -> bool:
    return email in db 

def get_user_db(db: dict, email: str):
    if (check_user_exists(db, email)):
        user_data = db[email]
        return schemas.UserInDb(**user_data)

def add_user_db(db: dict, email: str, password: str, username: str):
    if (not check_user_exists(db, email)):
        db[email] = {
                "email": email,
                "password": password,
                "username": username
                }

