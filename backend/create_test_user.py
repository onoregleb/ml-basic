#!/usr/bin/env python3
"""
Скрипт для создания тестового пользователя
"""

try:
    from database import get_db
    from routers.auth import get_password_hash
    from models import User
    from datetime import datetime
    
    # Создаем тестового пользователя
    db = next(get_db())
    
    # Проверяем, есть ли уже пользователь с таким email
    existing_user = db.query(User).filter(User.email == 'test@test.com').first()
    if existing_user:
        print("⚠️ Пользователь test@test.com уже существует")
        print(f"ID: {existing_user.id}, Имя: {existing_user.full_name}")
    else:
        # Создаем нового пользователя
        hashed_password = get_password_hash('test123')
        test_user = User(
            email='test@test.com',
            full_name='Test User',
            hashed_password=hashed_password,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Успешно создан тестовый пользователь!")
        print("Email: test@test.com")
        print("Пароль: test123")
        print(f"ID: {test_user.id}")
        print(f"Имя: {test_user.full_name}")
    
    # Показываем всех пользователей в базе
    all_users = db.query(User).all()
    print(f"\n📊 Всего пользователей в базе: {len(all_users)}")
    for user in all_users:
        print(f"- {user.email} (ID: {user.id}, Имя: {user.full_name})")
        
except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("Убедитесь, что вы активировали виртуальное окружение и установили зависимости:")
    print("pip install -r requirements.txt")
except Exception as e:
    print(f"❌ Ошибка: {e}")
