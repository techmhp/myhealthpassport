from src.models.user_models import User


async def create_user(name: str, email: str):
    return await User.create(name=name, email=email)


async def get_all_users():
    return await User.all()


async def get_user_by_id(user_id: int):
    return await User.get_or_none(id=user_id)


async def update_user(user_id: int, name: str, email: str):
    user = await User.get_or_none(id=user_id)
    if user:
        user.name = name
        user.email = email
        await user.save()
    return user


async def delete_user(user_id: int):
    return await User.filter(id=user_id).delete()
